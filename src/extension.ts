'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// default configs
let configs = 
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

const wastTargets : string[] = ['.cpp'];
const abiTargets : string[] = ['.hpp', '.h', '.cpp'];

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let terminal = vscode.window.createTerminal('eoscode terminal');
    context.subscriptions.push(terminal);

    console.log('Congratulations, your extension "eoscode" is now active!');
    loadConfig();

    registerEOSCodeCommand(context, 'extension.test', () => 
    {
        runTestCode(context);
    });

    registerEOSCodeCommand(context, 'extension.createWAST', () => 
    {
        const filePath = getCurrentFilePath();
        createWAST(terminal, filePath);
    });

    registerEOSCodeCommand(context, 'extension.createABI', () => 
    {
        const filePath = getCurrentFilePath();
        createABI(terminal, filePath);
    });

    registerEOSCodeCommand(context, 'extension.inputContractAccount', () => 
    {
        inputContractAccount(account => vscode.window.showInformationMessage(`contract account : ${account}`));
    });

    registerEOSCodeCommand(context, 'extension.inputContractOption', () => 
    {
        inputContractOption(option => vscode.window.showInformationMessage(`option : ${option}`));
    });

    registerEOSCodeCommand(context, 'extension.buildContract', () => 
    {
        buildContract(terminal);
    });

    registerEOSCodeCommand(context, 'extension.setContract', () => 
    {
        setContract(terminal);
    });

    registerEOSCodeCommand(context, 'extension.buildAndSetContract', () => 
    {
        buildContract(terminal);
        setContract(terminal);
    });

    registerEOSCodeCommand(context, 'extension.unlockWallet', () => 
    {
        unlockWallet(terminal);
    });
    
    registerEOSCodeCommand(context, 'extension.showContractInterface', () => 
    {
        showContractInterface(context, terminal);
    });

}

// this method is called when your extension is deactivated
export function deactivate() {
}

function registerEOSCodeCommand(
    context: vscode.ExtensionContext, 
    command: string, 
    callback: (...args: any[]) => any) 
{
    let disposable = vscode.commands.registerCommand(command, () => 
    {
        onPreCommand();
        callback.call(null);
    });
    context.subscriptions.push(disposable);
}

function onPreCommand()
{
    loadConfig();
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
    let targetDir = configs.buildTarget.targetDir;

    if (!fs.existsSync(targetDir))
    {   // update to current dir.
        targetDir = path.dirname(filePath);
        configs.buildTarget.targetDir = targetDir;
        
        let errorMsg = 'Error(buildTarget.targetDir) : No exist directory : ${targetDir}. Reset targetDir to source file directory.';
        vscode.window.showErrorMessage(errorMsg);
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

    configs.buildTarget.wastSource = filePath;

    const targetDir = getValidTargetDir(filePath);
    
    const targetName = `${targetDir}/${onlyName}.wast`;
    const eosiocppPath = configs.eosPath.eosiocppPath;
    terminal.sendText(eosiocppPath + ` -o ${targetName} ${filePath}`);
    vscode.window.showInformationMessage(eosiocppPath + ` -o ${targetName} ${filePath}`);

    saveConfig(configs);
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

    configs.buildTarget.abiSource = filePath;
    
    const targetDir = getValidTargetDir(filePath);;

    const targetName = `${targetDir}/${onlyName}.abi`;
    const eosiocppPath = configs.eosPath.eosiocppPath;
    terminal.sendText(eosiocppPath + ` -g ${targetName} ${filePath}`);
    vscode.window.showInformationMessage(eosiocppPath + ` -g ${targetName} ${filePath}`);
    saveConfig(configs);
}

function getConfigPath() : string
{
    let rootDir = vscode.workspace.rootPath;
    if (!rootDir)
    {
        return '';
    }
    
    const configName = 'eoscode.config.json'
    const configPath = path.join(rootDir, configName);
    // console.log(configPath);

    return configPath;
}

function getConfig() : any
{
    const configPath = getConfigPath();

    if (!fs.existsSync(configPath))
    {
        // var arr = fs.readdirSync(".");
        console.log('config file is NOT existed. create new one.');
        saveConfig(configs);
    }

    if (!fs.existsSync(configPath))
        return undefined;
    
    console.log('config file is existed.');

    let jsonContents = fs.readFileSync(configPath, 'utf8');

    let obj = undefined;
    try
    {
        obj = JSON.parse(jsonContents);
    }
    catch(error)
    {
        vscode.window.showErrorMessage(`Invalid 'eoscode.config.json'. Initialize. : ${error}`);
        saveConfig(configs);
        obj = configs;
    }

    return obj;
}

function loadConfig()
{
    configs = getConfig();
}

function saveConfig(obj : any)
{
    const configPath = getConfigPath();
    const configContents = JSON.stringify(obj, null, 4);

    fs.writeFileSync(configPath, configContents, 'utf8');
}

function getOnlyFileName(filePath : string)
{
    let extName = path.extname(filePath);
    let fileBaseName = path.basename(filePath, extName);
    return fileBaseName;
}

function setContract(terminal : vscode.Terminal)
{
    let account = configs.contract.account;
    const option = configs.contract.option;
    const dir = configs.buildTarget.targetDir;
    const permission = configs.contract.permission;

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
    const cleosPath = configs.eosPath.cleosPath;
    const cleosOption = configs.eosPath.cleosOption;
    return `${cleosPath} ${cleosOption}`;
}

function buildContract(terminal : vscode.Terminal)
{
    const wastSource = configs.buildTarget.wastSource;
    const abiSource = configs.buildTarget.abiSource;
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

    createWAST(terminal, configs.buildTarget.wastSource);
    createABI(terminal, configs.buildTarget.abiSource);
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

        configs.contract.account = account;
        saveConfig(configs);

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

        configs.contract.option = option;
        saveConfig(configs);

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
    const dir = configs.buildTarget.targetDir;
    return path.join(dir, getOnlyFileName(configs.buildTarget.abiSource) + ".abi");
}

function getWastPath() : string
{
    const dir = configs.buildTarget.targetDir;
    return path.join(dir, getOnlyFileName(configs.buildTarget.wastSource) + ".wast");
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
        user account : <input type="text" name="account" value="${configs.contract.user}" />
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
                configs.contract.user = userAccount;
                saveConfig(configs);

                const functionSepIndex = message.text.indexOf('(');
                const functionName = message.text.slice(userSepIndex + 1, functionSepIndex);
                //console.log(`${userAccount}, ${functionName}`);

                const paramString = message.text.slice(functionSepIndex + 2);
                const params = `'[${paramString}]'`;
                //console.log(params);

                let cmd = `${getCleosPath()} push action ${configs.contract.account} ${functionName} ${params} -p ${userAccount}`;
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
                let cmd = `${getCleosPath()} get table ${configs.contract.account} ${scope} ${tableName}`;
                selectTerminal(terminal);
                terminal.sendText(cmd);
                return;
            }
        }
    }, undefined, context.subscriptions);
}