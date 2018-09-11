'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class EOSCode {
    public context: vscode.ExtensionContext;
    // default configs
    public configs =
        {
            eosPath: {
                eosiocppPath: "eosiocpp",
                cleosPath: "cleos",
                cleosOption: "-u http://127.0.0.1:8888 --wallet-url http://127.0.0.1:8900" // local net
            },
            buildTarget: {
                wastSource: "",
                abiSource: "",
                targetDir: ""
            },
            contract: {
                account: "",
                option: "",
                permission: "",
                user: "YOUR_USER_ACCOUNT@active"
            }
        };

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public loadConfig(): Boolean {
        const configPath = this.getConfigPath();

        if (!fs.existsSync(configPath)) {
            // var arr = fs.readdirSync(".");
            console.log('config file is NOT existed. create new one.');
            this.saveConfig(this.configs);
        }

        if (!fs.existsSync(configPath))
            return false;

        console.log('config file is existed.');

        let jsonContents = fs.readFileSync(configPath, 'utf8');

        let obj = undefined;
        try {
            obj = JSON.parse(jsonContents);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Invalid 'eoscode.config.json'. Initialize. : ${error}`);
            this.saveConfig(this.configs);
            obj = this.configs;
        }

        this.configs = obj;
        return true;
    }

    // todo@cityofstars - make private on finish refactoring
    public saveConfig(obj: any) {
        const configPath = this.getConfigPath();
        const configContents = JSON.stringify(obj, null, 4);

        fs.writeFileSync(configPath, configContents, 'utf8');
    }

    // private methods
    private getConfigPath(): string {
        let rootDir = vscode.workspace.rootPath;
        if (!rootDir) {
            return '';
        }

        const configName = 'eoscode.config.json'
        const configPath = path.join(rootDir, configName);
        // console.log(configPath);

        return configPath;
    }

    
}