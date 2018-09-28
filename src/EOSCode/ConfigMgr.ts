'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

var util = require("./Util");

export class ConfigMgr {
    // default configs
    private configs =
    {
        eosPath: {
            eosiocppPath: "eosiocpp",
            cleosPath: "cleos",
            cleosOption: "-u http://127.0.0.1:8888 --wallet-url http://127.0.0.1:8900" // local net
        },
        buildTarget: {
            wasmSource: "",
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

    constructor() {
        // do something...
    }

    public loadConfig(): Boolean {
        const configPath = this.getConfigPath();

        if (!fs.existsSync(configPath)) {
            // var arr = fs.readdirSync(".");
            console.log('config file is NOT existed. create new one.');
            this.saveConfig(this.configs);
        }

        if (!fs.existsSync(configPath)) {
            return false;
        }

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

    public saveConfig(obj: any) {
        const configPath = this.getConfigPath();
        const configContents = JSON.stringify(obj, null, 4);

        fs.writeFileSync(configPath, configContents, 'utf8');
    }

    public getConfigs() : any {
        return this.configs;
    }

    public getCleosPathWithOption() : string{
        const cleosPath = this.configs.eosPath.cleosPath;
        const cleosOption = this.configs.eosPath.cleosOption;
        return `${cleosPath} ${cleosOption}`;
    }

    public getWasmSourcePath(): string {
        return this.configs.buildTarget.wasmSource;
    }

    public getAbiSourcePath(): string {
        return this.configs.buildTarget.abiSource;
    }

    public getValidTargetDir(filePath: string): string {
        let targetDir = this.configs.buildTarget.targetDir;

        if (targetDir.length === 0) {   // update to current dir.
            targetDir = path.join(path.dirname(filePath), "output");
            this.configs.buildTarget.targetDir = targetDir;
        }

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir);
        }

        return targetDir;
    }

    public getABIPath(): string {
        const dir = this.configs.buildTarget.targetDir;
        return path.join(dir, util.getOnlyFileName(this.configs.buildTarget.abiSource) + ".abi");
    }

    public getWasmPath(): string {
        const dir = this.configs.buildTarget.targetDir;
        return path.join(dir, util.getOnlyFileName(this.configs.buildTarget.wasmSource) + ".wasm");
    }

    // private methods
    private getConfigPath(): string {
        let rootDir = vscode.workspace.rootPath;
        if (!rootDir) {
            return '';
        }

        const configName = 'eoscode.config.json';
        const configPath = path.join(rootDir, configName);
        // console.log(configPath);

        return configPath;
    }
}