'use strict';

//import * as fs from 'fs';
import * as path from 'path';

module.exports.getOnlyFileName = function(filePath : string) {
    let extName = path.extname(filePath);
    let fileBaseName = path.basename(filePath, extName);
    return fileBaseName;
};

module.exports.getPathByPlatform = function(filePath : string) {
    if (process.platform === 'win32') {
        if (filePath[0] === '/') {
            return filePath;
        }

        let rootFolder = "rootfs";
        let rootIndex = filePath.indexOf(rootFolder);
        if(rootIndex !== -1)
        {
            // convert to posix style (rootfs -> /)
            filePath = filePath.substr(rootIndex + rootFolder.length);
            filePath = filePath.replace(/\\/gi, "/");
        }        
    }
    
    return filePath;
};
