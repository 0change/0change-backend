const fs = require('fs');
const path = require('path');

module.exports = (file, dir2)=>{
    return new Promise(function (resolve, reject) {
        //gets file name and adds it to dir2
        var f = path.basename(file);
        var dest = dir2; //path.resolve(dir2, f);

        fs.rename(file, dest, (err)=>{
            if(err)
                reject(err);
            else
                resolve(true);
        });

    })
};

/**
 * move file1.htm from 'test/' to 'test/dir_1/'
 *
 * example: moveFile('./test/file1.htm', './test/dir_1/');
 */