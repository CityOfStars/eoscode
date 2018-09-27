'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigMgr } from './ConfigMgr';
import { ABIInterfaceMgr } from './ABIInterfaceMgr';

var util = require("./Util");

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class EOSCode {
    private wastTargets : string[] = ['.cpp'];
    private abiTargets : string[] = ['.hpp', '.h', '.cpp'];

    public context: vscode.ExtensionContext;
    public terminal: vscode.Terminal;

    // components
    public configMgr = new ConfigMgr();
    public abiInterfaceMgr = new ABIInterfaceMgr();

    constructor(context: vscode.ExtensionContext, terminal: vscode.Terminal) {
        this.context = context;
        this.terminal = terminal;
    }

    public init() {
        console.log('Congratulations, your extension "eoscode" is now active!');
        this.configMgr.loadConfig();

        this.registerEOSCodeCommand('extension.test', () => {
            this.runTestCode();
        });

        this.registerEOSCodeCommand('extension.createWAST', () => {
            const filePath = this.getCurrentFilePath();
            this.createWAST(filePath);
        });

        this.registerEOSCodeCommand('extension.createABI', () => {
            const filePath = this.getCurrentFilePath();
            this.createABI(filePath);
        });

        this.registerEOSCodeCommand('extension.inputContractAccount', () => {
            this.inputContractAccount(account => vscode.window.showInformationMessage(`contract account : ${account}`));
        });

        this.registerEOSCodeCommand('extension.inputContractOption', () => {
            this.inputContractOption(option => vscode.window.showInformationMessage(`option : ${option}`));
        });

        this.registerEOSCodeCommand('extension.buildContract', () => {
            this.buildContract();
        });

        this.registerEOSCodeCommand('extension.setContract', () => {
            this.setContract();
        });

        this.registerEOSCodeCommand('extension.buildAndSetContract', () => {
            this.buildContract();
            this.setContract();
        });

        this.registerEOSCodeCommand('extension.unlockWallet', () => {
            this.unlockWallet();
        });

        this.registerEOSCodeCommand('extension.showContractInterface', () => {
            this.showContractInterface();
        });

        // if you add a new command, please add to 'package.json' too.
    }

    // todo@cityofstars - make private on finish refactoring
    public registerEOSCodeCommand(
        command: string,
        callback: (...args: any[]) => any) {
        let disposable = vscode.commands.registerCommand(command, () => {
            this.onPreCommand();
            callback.call(this);
        });
        this.context.subscriptions.push(disposable);
    }

    private onPreCommand() {
        this.configMgr.loadConfig();
    }

    private getCurrentFilePath(): string {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return '';
        }

        let doc = editor.document;
        if (!doc) {
            return '';
        }

        return doc.fileName;
    }

    // > eosiocpp -o targetName fileName
    private createWAST(filePath: string) {
        this.terminal.show();

        if (!filePath.length)
            return;

        const onlyName = util.getOnlyFileName(filePath);
        const ext = path.extname(filePath);
        if (!this.wastTargets.find((e) => { return e == ext; })) {
            vscode.window.showErrorMessage(`Error(wast) : Invalid file extension : "${ext}". expected : ` + this.wastTargets);
            return;
        }

        let configs = this.configMgr.getConfigs();
        configs.buildTarget.wastSource = filePath;

        const targetDir = this.configMgr.getValidTargetDir(filePath);

        const targetName = `${targetDir}/${onlyName}.wast`;
        const eosiocppPath = configs.eosPath.eosiocppPath;
        this.terminal.sendText(eosiocppPath + ` -o ${targetName} ${filePath}`);
        vscode.window.showInformationMessage(eosiocppPath + ` -o ${targetName} ${filePath}`);

        this.configMgr.saveConfig(configs);
    }


    // > eosiocpp -g targetName fileName
    private createABI(filePath: string) {
        this.terminal.show();

        if (!filePath.length)
            return;

        const onlyName = util.getOnlyFileName(filePath);
        const ext = path.extname(filePath);
        if (!this.abiTargets.find((e) => { return e == ext; })) {
            vscode.window.showErrorMessage(`Invalid file extension : "${ext}". expected : ` + this.abiTargets);
            return;
        }

        let configs = this.configMgr.getConfigs();
        configs.buildTarget.abiSource = filePath;

        const targetDir = this.configMgr.getValidTargetDir(filePath);;

        const targetName = `${targetDir}/${onlyName}.abi`;
        const eosiocppPath = configs.eosPath.eosiocppPath;
        this.terminal.sendText(eosiocppPath + ` -g ${targetName} ${filePath}`);
        vscode.window.showInformationMessage(eosiocppPath + ` -g ${targetName} ${filePath}`);
        this.configMgr.saveConfig(configs);
    }

    private setContract() {
        const configs = this.configMgr.getConfigs();
        let account = configs.contract.account;
        const option = configs.contract.option;
        const dir = configs.buildTarget.targetDir;
        const permission = configs.contract.permission;

        if (account.length == 0) {
            this.inputContractAccount(accountFromUser => {
                this.setContract();
            });
            return;
        }

        if (dir.length == 0) {
            vscode.window.showErrorMessage('Error(buildTarget.targetDir) : Please check your contract target dir.');
            return;
        }

        this.terminal.show();

        let wast = this.configMgr.getWastPath();
        let abi = this.configMgr.getABIPath();
        
        wast = path.basename(wast);
        let wasm = util.getOnlyFileName(wast) + ".wasm";
        abi = path.basename(abi);

        const cmd = this.configMgr.getCleosPathWithOption() + ` set contract ${option} ${account} ${dir} ${wasm} ${abi} ${permission}`;
        this.terminal.sendText(cmd);
        vscode.window.showInformationMessage(cmd);
    }

    private buildContract() {
        const wastSource = this.configMgr.getWastSourcePath();
        const abiSource = this.configMgr.getAbiSourcePath();
        if (wastSource.length == 0 ||
            !fs.existsSync(wastSource)) {
            //TODO@CityOfStars - input new source
            vscode.window.showErrorMessage(`Error(wastSource) : Please configure .wast Build Target`);
            return;
        }

        if (abiSource.length == 0 ||
            !fs.existsSync(abiSource)) {
            //TODO@CityOfStars - input new source
            vscode.window.showErrorMessage(`Error(abiSource) : Please configure .abi Build Target`);
            return;
        }

        this.createWAST(wastSource);
        this.createABI(abiSource);
    }

    private runTestCode() {
        // Create and show panel
        const panel = vscode.window.createWebviewPanel('catCoding', "Cat Coding", vscode.ViewColumn.One,
            {
                enableScripts: true
            });

        // And set its HTML content
        panel.webview.html = this.abiInterfaceMgr.getABIWebviewContent(this.configMgr.getABIPath(), this.configMgr.getConfigs().contract.user);

        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'alert':
                    vscode.window.showErrorMessage(message.text);
                    return;
            }
        }, undefined, this.context.subscriptions);
    }

    private input(myPlaceHolder: string, callback: (...args: any[]) => any) {
        const inputValue = vscode.window.showInputBox({
            placeHolder: myPlaceHolder,
        });

        inputValue.then(inputValue => {
            callback.call(this, inputValue);
        });
    }

    private inputFixed(myPlaceHolder: string, callback: (...args: any[]) => any) {
        const inputValue = vscode.window.showInputBox({
            placeHolder: myPlaceHolder,
            ignoreFocusOut: true
        });

        inputValue.then(inputValue => {
            callback.call(this, inputValue);
        });
    }

    private inputContractAccount(callback: (...args: any[]) => any) {
        this.input('Your contract account.', account => {
            if (!account ||
                account.length == 0) {
                const errorMsg = 'Error(contract.account) : Please check your contract account.'
                vscode.window.showErrorMessage(errorMsg);
                throw Error(errorMsg);
            }

            let configs = this.configMgr.getConfigs();
            configs.contract.account = account;
            this.configMgr.saveConfig(configs);

            callback.call(this, account);
        });
    }

    private inputContractOption(callback: (...args: any[]) => any) {
        this.input('Your option of contract. (set contract [option] account ...)', option => {
            if (!option ||
                option.length == 0) {
                const errorMsg = 'Error(contract.option) : Please check your contract option.'
                vscode.window.showErrorMessage(errorMsg);
                throw Error(errorMsg);
            }

            let configs = this.configMgr.getConfigs();
            configs.contract.option = option;
            this.configMgr.saveConfig(configs);

            callback.call(this, option);
        });
    }

    private async unlockWallet() {
        this.terminal.show();
        let cmd = this.configMgr.getCleosPathWithOption() + " wallet unlock";
        this.terminal.sendText(cmd);

        await sleep(1000);

        this.inputFixed('Your wallet passward.', pw => {
            this.terminal.show();
            this.terminal.sendText(pw);
        });
    }

    public showContractInterface() {
        // Create and show panel
        let configs = this.configMgr.getConfigs();
        const panel = vscode.window.createWebviewPanel('contractInterface', "EOS Code - Contract Interface", vscode.ViewColumn.One,
            {
                enableScripts: true
            });

        // And set its HTML content
        panel.webview.html = this.abiInterfaceMgr.getABIWebviewContent(this.configMgr.getABIPath(), configs.contract.user);

        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'pushAction':
                    {
                        vscode.window.showInformationMessage(message.text);

                        const userSepIndex = message.text.indexOf('$');
                        const userAccount = message.text.slice(0, userSepIndex);
                        configs.contract.user = userAccount;
                        this.configMgr.saveConfig(configs);

                        const functionSepIndex = message.text.indexOf('(');
                        const functionName = message.text.slice(userSepIndex + 1, functionSepIndex);
                        //console.log(`${userAccount}, ${functionName}`);

                        const paramString = message.text.slice(functionSepIndex + 2);
                        const params = `'[${paramString}]'`;
                        //console.log(params);

                        let cmd = `${this.configMgr.getCleosPathWithOption()} push action ${configs.contract.account} ${functionName} ${params} -p ${userAccount}`;
                        this.terminal.show();
                        this.terminal.sendText(cmd);

                        return;
                    }
                case 'getTable':
                    {
                        vscode.window.showInformationMessage(message.text);

                        const tableSepIndex = message.text.indexOf('@');
                        const tableName = message.text.slice(0, tableSepIndex);
                        const scope = message.text.slice(tableSepIndex + 1);
                        let cmd = `${this.configMgr.getCleosPathWithOption()} get table ${configs.contract.account} ${scope} ${tableName}`;
                        this.terminal.show();
                        this.terminal.sendText(cmd);
                        return;
                    }
            }
        }, this, this.context.subscriptions);
    }

}