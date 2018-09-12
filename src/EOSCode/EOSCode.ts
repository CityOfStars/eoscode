'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigMgr } from './ConfigMgr';

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

    public getValidTargetDir(filePath: string): string {
        let targetDir = this.configMgr.configs.buildTarget.targetDir;

        if (targetDir.length == 0) {   // update to current dir.
            targetDir = path.join(path.dirname(filePath), "output");
            this.configMgr.configs.buildTarget.targetDir = targetDir;
        }

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir);
        }

        return targetDir;
    }

    // > eosiocpp -o targetName fileName
    private createWAST(filePath: string) {
        this.terminal.show();

        if (!filePath.length)
            return;

        const onlyName = this.getOnlyFileName(filePath);
        const ext = path.extname(filePath);
        if (!this.wastTargets.find((e) => { return e == ext; })) {
            vscode.window.showErrorMessage(`Error(wast) : Invalid file extension : "${ext}". expected : ` + this.wastTargets);
            return;
        }

        this.configMgr.configs.buildTarget.wastSource = filePath;

        const targetDir = this.getValidTargetDir(filePath);

        const targetName = `${targetDir}/${onlyName}.wast`;
        const eosiocppPath = this.configMgr.configs.eosPath.eosiocppPath;
        this.terminal.sendText(eosiocppPath + ` -o ${targetName} ${filePath}`);
        vscode.window.showInformationMessage(eosiocppPath + ` -o ${targetName} ${filePath}`);

        this.configMgr.saveConfig(this.configMgr.configs);
    }


    // > eosiocpp -g targetName fileName
    private createABI(filePath: string) {
        this.terminal.show();

        if (!filePath.length)
            return;

        const onlyName = this.getOnlyFileName(filePath);
        const ext = path.extname(filePath);
        if (!this.abiTargets.find((e) => { return e == ext; })) {
            vscode.window.showErrorMessage(`Invalid file extension : "${ext}". expected : ` + this.abiTargets);
            return;
        }

        this.configMgr.configs.buildTarget.abiSource = filePath;

        const targetDir = this.getValidTargetDir(filePath);;

        const targetName = `${targetDir}/${onlyName}.abi`;
        const eosiocppPath = this.configMgr.configs.eosPath.eosiocppPath;
        this.terminal.sendText(eosiocppPath + ` -g ${targetName} ${filePath}`);
        vscode.window.showInformationMessage(eosiocppPath + ` -g ${targetName} ${filePath}`);
        this.configMgr.saveConfig(this.configMgr.configs);
    }

    private getOnlyFileName(filePath: string) {
        let extName = path.extname(filePath);
        let fileBaseName = path.basename(filePath, extName);
        return fileBaseName;
    }

    private setContract() {
        let account = this.configMgr.configs.contract.account;
        const option = this.configMgr.configs.contract.option;
        const dir = this.configMgr.configs.buildTarget.targetDir;
        const permission = this.configMgr.configs.contract.permission;

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

        let wast = this.getWastPath();
        let abi = this.getABIPath();

        const cmd = this.getCleosPath() + ` set contract ${option} ${account} ${dir} ${wast} ${abi} ${permission}`;
        this.terminal.sendText(cmd);
        vscode.window.showInformationMessage(cmd);
    }

    // get cleos path with option
    private getCleosPath() {
        const cleosPath = this.configMgr.configs.eosPath.cleosPath;
        const cleosOption = this.configMgr.configs.eosPath.cleosOption;
        return `${cleosPath} ${cleosOption}`;
    }

    private buildContract() {
        const wastSource = this.configMgr.configs.buildTarget.wastSource;
        const abiSource = this.configMgr.configs.buildTarget.abiSource;
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

        this.createWAST(this.configMgr.configs.buildTarget.wastSource);
        this.createABI(this.configMgr.configs.buildTarget.abiSource);
    }

    private runTestCode() {
        // Create and show panel
        const panel = vscode.window.createWebviewPanel('catCoding', "Cat Coding", vscode.ViewColumn.One,
            {
                enableScripts: true
            });

        // And set its HTML content
        panel.webview.html = this.getABIWebviewContent();

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

            this.configMgr.configs.contract.account = account;
            this.configMgr.saveConfig(this.configMgr.configs);

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

            this.configMgr.configs.contract.option = option;
            this.configMgr.saveConfig(this.configMgr.configs);

            callback.call(this, option);
        });
    }

    private async unlockWallet() {
        this.terminal.show();
        let cmd = this.getCleosPath() + " wallet unlock";
        this.terminal.sendText(cmd);

        await sleep(1000);

        this.inputFixed('Your wallet passward.', pw => {
            this.terminal.show();
            this.terminal.sendText(pw);
        });
    }

    private getABIPath(): string {
        const dir = this.configMgr.configs.buildTarget.targetDir;
        return path.join(dir, this.getOnlyFileName(this.configMgr.configs.buildTarget.abiSource) + ".abi");
    }

    private getWastPath(): string {
        const dir = this.configMgr.configs.buildTarget.targetDir;
        return path.join(dir, this.getOnlyFileName(this.configMgr.configs.buildTarget.wastSource) + ".wast");
    }

    private getABIWebviewContent() {
        let abiContents = JSON.parse(fs.readFileSync(this.getABIPath(), 'utf8'));
        //console.log(JSON.stringify(abiContents.actions, null, 4));

        let functionNames = [];
        let actions = abiContents.actions;
        for (let i = 0; i < actions.length; i++) {
            let obj = actions[i];
            //console.log(obj['name']);   // private names
            functionNames.push(obj['name']);
        }

        let tableNames = [];
        let tables = abiContents.tables;
        for (let i = 0; i < tables.length; i++) {
            let table = tables[i];
            tableNames.push(table.name);
        }

        // MUST REFACTOR IT
        let contents =
            `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
</head>
<body>
    <script>
        const vscode = acquireVsCodeApi();
        `
        for (let i = 0; i < functionNames.length; i++) {
            let functionName = functionNames[i];
            contents += `function on${functionName}()
        {
            let accountForm = document.forms["user-account"];
            let account = accountForm.getElementsByTagName("INPUT")[0].value;

            let t = account + '$${functionName}()';
            let form = document.forms["func${functionName}"];
            let inputElements = form.getElementsByTagName("INPUT");

            let isFirst = true;
            for (let i =0; i< inputElements.length; i++)
            {
                if(inputElements[i].getAttribute("type") != "submit")
                {
                    if(!isFirst)
                    {
                        t += ',';
                    }
                    isFirst = false;

                    //let paramName = inputElements[i].getAttribute("name");
                    let value = inputElements[i].value;

                    t += '\"' + value + '\"';
                }
            }
            
            vscode.postMessage({
                command: 'pushAction',
                text: t
            });

            return false;
        }
        `
        }

        for (let i = 0; i < tableNames.length; i++) {
            let tableName = tableNames[i];
            contents +=
                `
        function get${tableName}()
        {
            let form = document.forms["table${tableName}"];
            let scope = form.getElementsByTagName("INPUT")[0].value;
            //let inputElements = form.getElementsByTagName("INPUT"); // scope

            //let scope = inputElements[0].value;
        
            //let t = scope + '$' + tableName;
            let t = '${tableName}@' + scope;

            vscode.postMessage({
                command: 'getTable',
                text: t
            });

            return false;
        }
        `;
        }

        // user account
        contents += `</script><br/>
    <h1>Setting</h1><hr/>
    <form name="user-account">
        user account : <input type="text" name="account" value="${this.configMgr.configs.contract.user}" />
    </form><br/><br/>
    <h1>Functions</h1><hr/>
    `
        let structs = abiContents.structs;
        for (let i = 0; i < structs.length; i++) {
            let obj = structs[i];
            //console.log(obj['name']);   // structs names
            let functionName = obj['name'];
            //console.log("rammerchoi : " + functionNames.indexOf('rammerchoi'))
            if (functionNames.indexOf(functionName) == -1)
                continue;

            // obj == function
            console.log(functionName);
            let fields = obj['fields'];
            let nameTag = `<br/><br/><h2>${functionName}</h2><hr/>`;
            contents += nameTag;

            contents += `<form onsubmit="return on${functionName}();" name="func${functionName}" id="${functionName}">
        `;

            for (let k = 0; k < fields.length; k++) {
                let f = fields[k];
                let fieldName = f['name'];
                let fieldType = f['type'];
                //            let nodeName = `${functionName}_${fieldName}`;
                let tag = `${fieldName}(${fieldType}) : <input type="text" name="${fieldName}" id="${fieldName}"/><br/><br/>
            `;

                contents += tag;
            }

            contents += `<input type="submit" value="Push Action" /></form>
        
        `;
        }

        //TODO - form : input table scope & get table
        contents += `<br/><br/><h1>Tables</h1><hr/>`;

        let tableContents = '';
        for (let i = 0; i < tableNames.length; i++) {
            let tableName = tableNames[i];
            tableContents += `<br/><br/><h2>${tableName}</h2><hr/>`;
            tableContents +=
                `       
        <form name="table${tableName}" onsubmit="return get${tableName}();">
            scope : <input type="text" name="scope" />
            <input type="submit" value="Get Table" />
        </form><br/><br/>
`
        }

        contents += tableContents;

        contents += `</body></html>`;

        return contents;
    }

    private showContractInterface() {
        // Create and show panel
        const panel = vscode.window.createWebviewPanel('contractInterface', "EOS Code - Contract Interface", vscode.ViewColumn.One,
            {
                enableScripts: true
            });

        // And set its HTML content
        panel.webview.html = this.getABIWebviewContent();

        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'pushAction':
                    {
                        vscode.window.showInformationMessage(message.text);

                        const userSepIndex = message.text.indexOf('$');
                        const userAccount = message.text.slice(0, userSepIndex);
                        this.configMgr.configs.contract.user = userAccount;
                        this.configMgr.saveConfig(this.configMgr.configs);

                        const functionSepIndex = message.text.indexOf('(');
                        const functionName = message.text.slice(userSepIndex + 1, functionSepIndex);
                        //console.log(`${userAccount}, ${functionName}`);

                        const paramString = message.text.slice(functionSepIndex + 2);
                        const params = `'[${paramString}]'`;
                        //console.log(params);

                        let cmd = `${this.getCleosPath()} push action ${this.configMgr.configs.contract.account} ${functionName} ${params} -p ${userAccount}`;
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
                        let cmd = `${this.getCleosPath()} get table ${this.configMgr.configs.contract.account} ${scope} ${tableName}`;
                        this.terminal.show();
                        this.terminal.sendText(cmd);
                        return;
                    }
            }
        }, this, this.context.subscriptions);
    }
}