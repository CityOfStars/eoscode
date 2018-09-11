'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { EOSCode } from './EOSCode/EOSCode';

//todo@cityofstars - remove
import {ConfigMgr} from './EOSCode/configMgr';

const wastTargets : string[] = ['.cpp'];
const abiTargets : string[] = ['.hpp', '.h', '.cpp'];

var eoscode : EOSCode;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let terminal = vscode.window.createTerminal('eoscode terminal');
    context.subscriptions.push(terminal);

    eoscode = new EOSCode(context, terminal);

    console.log('Congratulations, your extension "eoscode" is now active!');
    eoscode.configMgr.loadConfig();

    eoscode.registerEOSCodeCommand('extension.test', () => 
    {
        runTestCode(context);
    });

    eoscode.registerEOSCodeCommand('extension.createWAST', () => 
    {
        const filePath = getCurrentFilePath();
        createWAST(terminal, filePath);
    });

    eoscode.registerEOSCodeCommand('extension.createABI', () => 
    {
        const filePath = getCurrentFilePath();
        createABI(terminal, filePath);
    });

    eoscode.registerEOSCodeCommand('extension.inputContractAccount', () => 
    {
        inputContractAccount(account => vscode.window.showInformationMessage(`contract account : ${account}`));
    });

    eoscode.registerEOSCodeCommand('extension.inputContractOption', () => 
    {
        inputContractOption(option => vscode.window.showInformationMessage(`option : ${option}`));
    });

    eoscode.registerEOSCodeCommand('extension.buildContract', () => 
    {
        buildContract(terminal);
    });

    eoscode.registerEOSCodeCommand('extension.setContract', () => 
    {
        setContract(terminal);
    });

    eoscode.registerEOSCodeCommand('extension.buildAndSetContract', () => 
    {
        buildContract(terminal);
        setContract(terminal);
    });

    eoscode.registerEOSCodeCommand('extension.unlockWallet', () => 
    {
        unlockWallet(terminal);
    });
    
    eoscode.registerEOSCodeCommand('extension.showContractInterface', () => 
    {
        showContractInterface(context, terminal);
    });

}

// this method is called when your extension is deactivated
export function deactivate() {
}

function getCurrentFilePath() : string
{
    let editor = vscode.window.activeTextEditor;
    if(!editor)
    {
        return '';
    }

    let doc = editor.document;
    if(!doc)
    {
        return '';
    }

    return doc.fileName;
}

function selectTerminal(terminal : vscode.Terminal)
{
    terminal.show();
}

function getValidTargetDir(filePath : string) : string
{
    let targetDir = eoscode.configMgr.configs.buildTarget.targetDir;

    if(targetDir.length == 0)
    {   // update to current dir.
        targetDir = path.join(path.dirname(filePath), "output");
        eoscode.configMgr.configs.buildTarget.targetDir = targetDir;
    }

    if (!fs.existsSync(targetDir))
    {   
        fs.mkdirSync(targetDir);
    }

    return targetDir;
}

// > eosiocpp -o targetName fileName
function createWAST(terminal : vscode.Terminal, filePath : string)
{
    selectTerminal(terminal);

    if (!filePath.length)
        return;
    
    const onlyName = getOnlyFileName(filePath);
    const ext = path.extname(filePath);
    if (!wastTargets.find((e) => { return e == ext; }))
    {
        vscode.window.showErrorMessage(`Error(wast) : Invalid file extension : "${ext}". expected : ` + wastTargets);
        return;    
    }

    eoscode.configMgr.configs.buildTarget.wastSource = filePath;

    const targetDir = getValidTargetDir(filePath);
    
    const targetName = `${targetDir}/${onlyName}.wast`;
    const eosiocppPath = eoscode.configMgr.configs.eosPath.eosiocppPath;
    terminal.sendText(eosiocppPath + ` -o ${targetName} ${filePath}`);
    vscode.window.showInformationMessage(eosiocppPath + ` -o ${targetName} ${filePath}`);

    eoscode.configMgr.saveConfig(eoscode.configMgr.configs);
}


// > eosiocpp -g targetName fileName
function createABI(terminal : vscode.Terminal, filePath : string)
{
    selectTerminal(terminal);

    if (!filePath.length)
        return;

    const onlyName = getOnlyFileName(filePath);
    const ext = path.extname(filePath);
    if (!abiTargets.find((e) => { return e == ext; }))
    {
        vscode.window.showErrorMessage(`Invalid file extension : "${ext}". expected : ` + abiTargets);
        return;    
    }

    eoscode.configMgr.configs.buildTarget.abiSource = filePath;
    
    const targetDir = getValidTargetDir(filePath);;

    const targetName = `${targetDir}/${onlyName}.abi`;
    const eosiocppPath = eoscode.configMgr.configs.eosPath.eosiocppPath;
    terminal.sendText(eosiocppPath + ` -g ${targetName} ${filePath}`);
    vscode.window.showInformationMessage(eosiocppPath + ` -g ${targetName} ${filePath}`);
    eoscode.configMgr.saveConfig(eoscode.configMgr.configs);
}

function getOnlyFileName(filePath : string)
{
    let extName = path.extname(filePath);
    let fileBaseName = path.basename(filePath, extName);
    return fileBaseName;
}

function setContract(terminal : vscode.Terminal)
{
    let account = eoscode.configMgr.configs.contract.account;
    const option = eoscode.configMgr.configs.contract.option;
    const dir = eoscode.configMgr.configs.buildTarget.targetDir;
    const permission = eoscode.configMgr.configs.contract.permission;

    if(account.length == 0)
    {
        inputContractAccount(accountFromUser => {
            setContract(terminal);
        });
        return;
    }

    if (dir.length == 0)
    {
        vscode.window.showErrorMessage('Error(buildTarget.targetDir) : Please check your contract target dir.');
        return;
    }

    selectTerminal(terminal);

    let wast = getWastPath();
    let abi = getABIPath(); 

    const cmd = getCleosPath() + ` set contract ${option} ${account} ${dir} ${wast} ${abi} ${permission}`;
    terminal.sendText(cmd);
    vscode.window.showInformationMessage(cmd);
}

// get cleos path with option
function getCleosPath()
{
    const cleosPath = eoscode.configMgr.configs.eosPath.cleosPath;
    const cleosOption = eoscode.configMgr.configs.eosPath.cleosOption;
    return `${cleosPath} ${cleosOption}`;
}

function buildContract(terminal : vscode.Terminal)
{
    const wastSource = eoscode.configMgr.configs.buildTarget.wastSource;
    const abiSource = eoscode.configMgr.configs.buildTarget.abiSource;
    if (wastSource.length == 0 ||
        !fs.existsSync(wastSource))
    {
        //TODO@CityOfStars - input new source
        vscode.window.showErrorMessage(`Error(wastSource) : Please configure .wast Build Target`);
        return;
    }

    if (abiSource.length == 0 ||
        !fs.existsSync(abiSource))
    {
        //TODO@CityOfStars - input new source
        vscode.window.showErrorMessage(`Error(abiSource) : Please configure .abi Build Target`);
        return;
    }

    createWAST(terminal, eoscode.configMgr.configs.buildTarget.wastSource);
    createABI(terminal, eoscode.configMgr.configs.buildTarget.abiSource);
}

function runTestCode(context : vscode.ExtensionContext)
{
    // Create and show panel
    const panel = vscode.window.createWebviewPanel('catCoding', "Cat Coding", vscode.ViewColumn.One, 
        {
            enableScripts: true
        });

    // And set its HTML content
    panel.webview.html = getABIWebviewContent();

    panel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
            case 'alert':
                vscode.window.showErrorMessage(message.text);
                return;
        }
    }, undefined, context.subscriptions);
}

function input(myPlaceHolder : string, callback : (...args: any[]) => any)
{
    const inputValue = vscode.window.showInputBox({
        placeHolder: myPlaceHolder,
    }); 
    
    inputValue.then(inputValue => {
        callback.call(null, inputValue);
    });
}

function inputFixed(myPlaceHolder : string, callback : (...args: any[]) => any)
{
    const inputValue = vscode.window.showInputBox({
        placeHolder: myPlaceHolder,
        ignoreFocusOut: true
    }); 
    
    inputValue.then(inputValue => {
        callback.call(null, inputValue);
    });
}

function inputContractAccount(callback : (...args: any[]) => any)
{
    input('Your contract account.', account => {
        if (!account ||
            account.length == 0)
        {
            const errorMsg = 'Error(contract.account) : Please check your contract account.'
            vscode.window.showErrorMessage(errorMsg);
            throw Error(errorMsg);    
        }

        eoscode.configMgr.configs.contract.account = account;
        eoscode.configMgr.saveConfig(eoscode.configMgr.configs);

        callback.call(null, account);
    });
}

function inputContractOption(callback : (...args: any[]) => any)
{
    input('Your option of contract. (set contract [option] account ...)', option => {
        if (!option ||
            option.length == 0)
        {
            const errorMsg = 'Error(contract.option) : Please check your contract option.'
            vscode.window.showErrorMessage(errorMsg);
            throw Error(errorMsg);
        }

        eoscode.configMgr.configs.contract.option = option;
        eoscode.configMgr.saveConfig(eoscode.configMgr.configs);

        callback.call(null, option);
    });
}

function sleep(ms: number) 
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function unlockWallet(terminal : vscode.Terminal)
{
    selectTerminal(terminal);
    let cmd = getCleosPath() + " wallet unlock";
    terminal.sendText(cmd);

    await sleep(1000);

    inputFixed('Your wallet passward.', pw => {
        selectTerminal(terminal);
        terminal.sendText(pw);
    });
}

function getABIPath() : string
{
    const dir = eoscode.configMgr.configs.buildTarget.targetDir;
    return path.join(dir, getOnlyFileName(eoscode.configMgr.configs.buildTarget.abiSource) + ".abi");
}

function getWastPath() : string
{
    const dir = eoscode.configMgr.configs.buildTarget.targetDir;
    return path.join(dir, getOnlyFileName(eoscode.configMgr.configs.buildTarget.wastSource) + ".wast");
}

function getABIWebviewContent() {
    let abiContents =  JSON.parse(fs.readFileSync(getABIPath(), 'utf8'));
    //console.log(JSON.stringify(abiContents.actions, null, 4));
    
    let functionNames = [];
    let actions = abiContents.actions;
    for (let i = 0; i < actions.length; i++)
    {
        let obj = actions[i];
        //console.log(obj['name']);   // function names
        functionNames.push(obj['name']);
    }

    let tableNames = [];
    let tables = abiContents.tables;
    for(let i = 0; i < tables.length; i++)
    {
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
    for (let i = 0; i < functionNames.length; i++)
    {
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

    for (let i = 0; i < tableNames.length; i++)
    {
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
        user account : <input type="text" name="account" value="${eoscode.configMgr.configs.contract.user}" />
    </form><br/><br/>
    <h1>Functions</h1><hr/>
    `
    let structs = abiContents.structs;
    for (let i = 0; i < structs.length; i++)
    {
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
        
        contents +=`<form onsubmit="return on${functionName}();" name="func${functionName}" id="${functionName}">
        `;
        
        for (let k = 0; k < fields.length; k++)
        {
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
    for(let i = 0; i < tableNames.length; i++)
    {
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

    contents +=`</body></html>`;

    return contents;
}

function showContractInterface(context : vscode.ExtensionContext, terminal : vscode.Terminal)
{
     // Create and show panel
     const panel = vscode.window.createWebviewPanel('contractInterface', "EOS Code - Contract Interface", vscode.ViewColumn.One, 
     {
         enableScripts: true
     });

    // And set its HTML content
    panel.webview.html = getABIWebviewContent();

    panel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
            case 'pushAction':
            {
                vscode.window.showInformationMessage(message.text);
                
                const userSepIndex = message.text.indexOf('$');
                const userAccount = message.text.slice(0, userSepIndex);
                eoscode.configMgr.configs.contract.user = userAccount;
                eoscode.configMgr.saveConfig(eoscode.configMgr.configs);

                const functionSepIndex = message.text.indexOf('(');
                const functionName = message.text.slice(userSepIndex + 1, functionSepIndex);
                //console.log(`${userAccount}, ${functionName}`);

                const paramString = message.text.slice(functionSepIndex + 2);
                const params = `'[${paramString}]'`;
                //console.log(params);

                let cmd = `${getCleosPath()} push action ${eoscode.configMgr.configs.contract.account} ${functionName} ${params} -p ${userAccount}`;
                selectTerminal(terminal);
                terminal.sendText(cmd);

                return;
            }
            case 'getTable':
            {
                vscode.window.showInformationMessage(message.text);

                const tableSepIndex = message.text.indexOf('@');
                const tableName = message.text.slice(0, tableSepIndex);
                const scope = message.text.slice(tableSepIndex + 1);
                let cmd = `${getCleosPath()} get table ${eoscode.configMgr.configs.contract.account} ${scope} ${tableName}`;
                selectTerminal(terminal);
                terminal.sendText(cmd);
                return;
            }
        }
    }, undefined, context.subscriptions);
}