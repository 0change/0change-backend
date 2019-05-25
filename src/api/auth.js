const { Router } = require('express');
const User = require('../database/mongooseModels/User')
const UserSession = require('../database/mongooseModels/UserSession')
const validation = require('../utils/validation');
const encryptionUtil = require('../utils/encryption');
const nacl = require('tweetnacl');
const randomBytes = require('randombytes');
const qrcode = require("qrcode");
const image2base64 = require('image-to-base64');
const crypto = require("crypto");
const fetch = require("node-fetch");
const B64 = require('base64-js');
const LoginTry = require('../database/mongooseModels/LoginTry');
const Wallet = require('../database/mongooseModels/Wallet');
const requireParam = require('../middleware/requestParamRequire');
const EventBus = require('../eventBus');
let router = Router();
const i18n = require('i18n');

function getResponse(channel, aesKey){
  return new Promise(function (resolve, reject) {
    const ipAddress = process.env.UPLOAD_SERVER_IP;
    fetch(`http://${ipAddress}/profile/download/${channel}?t=${Date.now()}`).then(res => res.json()).
    then(function(data){
      if(!data.data){
        return reject({message: i18n.__('api.auth.bidNotConfirmed')});
      }
      const decipher = crypto.createDecipher('aes128', aesKey);
      const decrypted =
          decipher.update(data.data, 'base64', 'utf8') + decipher.final('utf8');
      const decryptedObj = JSON.parse(decrypted);

      //console.log(decryptedObj);

      var publicKey1 = process.env.SITE_PUBLIC_KEY;
      var publicKey2 = decryptedObj.publicKey;
      var timestamp = decryptedObj.timestamp;


      const message = encryptionUtil.strToUint8Array(publicKey2 + publicKey1 + timestamp);
      const sig = decryptedObj.signedMessage;

      console.log({
        publicKey1,
        publicKey2,
        timestamp,
        sig
      });

      if (nacl.sign.detached.verify(message, encryptionUtil.b64ToUint8Array(sig), encryptionUtil.b64ToUint8Array(publicKey2))){
        resolve(decryptedObj);
      }else{
        reject({message: i18n.__('api.auth.bidNotVerified')});
      }
    });
  })
}

function postData(channel, aesKey){
  const ipAddress = process.env.UPLOAD_SERVER_IP;
  image2base64(process.env.SITE_AVATAR_PATH).then(function(res){
    var photo = `data:image/jpeg;base64,${res}`;
    const dataObj = {
      publicKey: process.env.SITE_PUBLIC_KEY, // Need to be a random string
      photo,
      name : process.env.SITE_NAME,
      score: 10,
      signedMessage: null,
      timestamp: Date.now(),
    };

    const dataStr = JSON.stringify(dataObj);

    const cipher = crypto.createCipher('aes128', aesKey);

    let encrypted =
        cipher.update(dataStr, 'utf8', 'base64') + cipher.final('base64');


    // upload data to server
    fetch(`http://${ipAddress}/profile/upload`, {
      method: 'POST', // or 'PUT'
      body: JSON.stringify({ data: encrypted, uuid: channel }),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((res) => {
      if (res.status === 200) {
        console.log('successfully uploaded data')
      }
    }).catch((err) => {
      console.log(err);
    });
  });
}

function createNewUser(userInfo) {
  let newUser = null;
  return new Promise(function (resolve, reject) {
    try {
      newUser = new User({
        firstName: userInfo.name,
        lastName: "",
        avatar: userInfo.photo,
        brightIdPublicKey: userInfo.publicKey,
      });
      newUser.username = 'user-' + newUser._id;
      resolve(newUser);
    }catch (error){reject(error)}
  })
      .then(user => {
        // Assign wallet to user
        return Wallet.updateOne({assigned: false}, {assigned: true, user: user});
      })
      .then(() => {
        return Wallet.findOne({user: newUser._id});
      })
      .then(wallet => {
        newUser.address = wallet.address;
        return newUser;
      })
}

router.all('/genqr', function (req, res, next) {
  const ipAddress = process.env.UPLOAD_SERVER_IP;
  const b64Ip = Buffer.from(
      ipAddress.split('.').map((octet) => parseInt(octet, 10))
  )
      .toString('base64')
      .substring(0, 6);

  const aesKey = randomBytes(16).toString('base64');
  const uuid = encryptionUtil.b64ToUrlSafeB64(randomBytes(9).toString('base64'));
  const qrString = `${aesKey}${uuid}${b64Ip}`;

  const channel = uuid + "1";
  qrcode.toDataURL(qrString, async function(err, qrImage){
    let loginTry = new LoginTry({
      aesKey,
      uuid,
      qrString,
      qrImage
    });
    loginTry.save();
    // console.log(qr);
    res.send({
      success: true,
      id: loginTry._id,
      qrString,
      qrImage
    });
    postData(channel, aesKey);
  });
});

router.post('/login', requireParam('id:objectId'), function (req, res, next) {
  let {id} = req.body;
  let mLoginTry = null;
  let userInfo = null;
  LoginTry.findOne({_id: id})
      .then((loginTry) => {
        if (!loginTry){
          throw {message: i18n.__('api.auth.loginIdInvalid')};
        }
        mLoginTry = loginTry;
        return getResponse(loginTry.uuid + '2', loginTry.aesKey);
      })
      .then(info => {
        userInfo = info;
        mLoginTry.userInfo = userInfo;
        mLoginTry.save();
        return User.findOne({brightIdPublicKey: userInfo.publicKey});
      })
      .then(user => {
        if(!user){
          return createNewUser(userInfo);
        }
        return user;
      })
      .then(user => {
        if(user.brightIdScore != userInfo.score){
            user.brightIdScore = userInfo.score;
            EventBus.emit(EventBus.EVENT_BRIGHTID_SCORE_UPDATED, user);
        }else{
            user.brightIdScore = userInfo.score;
        }
        user.save();
        let session = new UserSession({
          user,
          token: user.createSessionToken(),
          active: true,
        });
        session.save();
        res.json({
          success: true,
          status: 'success',
          token: session.token
        });
      })
      .catch(err => {
        console.log(err);
        res.status(401).json({
          success: false,
          status: 'error',
          message: err.message || i18n.__('sse')
        })
      })
});

router.post('/logout', function (req, res, next) {
  let token = req.header('authorization');
  if (!!token && token.substr(0, 6).toLowerCase() === 'bearer')
    token = token.substr(7);
  UserSession.remove({token})
      .then(() => {
          res.send({
            success: true
          });
      })
      .catch(err => {
        res.send({
          success: false,
          message: i18n.__('sse')
        })
      });
});

module.exports = router;