'use strict';

//import * as fs from 'fs';
import * as path from 'path';

module.exports.getOnlyFileName = function(filePath : string) {
    let extName = path.extname(filePath);
    let fileBaseName = path.basename(filePath, extName);
    return fileBaseName;
}
