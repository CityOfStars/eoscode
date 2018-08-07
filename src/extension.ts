'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path'

let eosiocppPath = "eosiocpp";
let nodeosPath = "nodeos";
let cleosPath = "cleos";
let wastSource = "";
let abiSource = "";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let terminal = vscode.window.createTerminal('eoscode terminal');
    context.subscriptions.push(terminal);

    let wastTargets : string[] = ['.cpp'];
    let abiTargets : string[] = ['.hpp', '.h', '.cpp'];

    console.log('Congratulations, your extension "eoscode" is now active!');
    loadConfig();

    let disposable = vscode.commands.registerCommand('extension.createWAST', () => 
    {
        const filePath = getCurrentFilePath();
        if (!filePath.length)
            return;

        const onlyName = path.basename(filePath);
        const ext = path.extname(filePath);
        if (!wastTargets.find((e) => { return e == ext; }))
        {
            vscode.window.showInformationMessage(`Invalid file extension : ${ext} expected : ` + wastTargets);
            return;    
        }

        const targetName = onlyName + ".wast";
        createWAST(terminal, filePath, targetName);
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('extension.createABI', () => 
    {
        const filePath = getCurrentFilePath();
        if (!filePath.length)
            return;

        const onlyName = path.basename(filePath);
        const ext = path.extname(filePath);
        if (!abiTargets.find((e) => { return e == ext; }))
        {
            vscode.window.showInformationMessage(`Invalid file extension : ${ext} expected : ` + abiTargets);
            return;    
        }

        const targetName = onlyName + ".abi";
        createABI(terminal, filePath, targetName);
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('extension.buildContract', () => 
    {
        if (wastSource.length == 0 ||
            abiSource.length == 0)
            return;

        const wastSourceName = path.basename(wastSource);
        const wastSourceExt = path.extname(wastSource);
        if (!wastTargets.find((e) => { return e == wastSourceExt; }))
        {
            vscode.window.showInformationMessage(`Invalid file extension : ${wastSourceExt} expected : ` + wastTargets);
            return;    
        }

        const abiSourceName = path.basename(abiSource);
        const abiSourceExt = path.extname(abiSource);
        if (!abiTargets.find((e) => { return e == abiSourceExt; }))
        {
            vscode.window.showInformationMessage(`Invalid file extension : ${ext} expected : ` + abiTargets);
            return;    
        }

        const wastTargetName = wastSourceName + ".wast";
        createWAST(terminal, wastSource, wastTargetName);

        const abiTargetName = abiSourceName + ".abi";
        createABI(terminal, abiSource, abiTargetName);
    });
    context.subscriptions.push(disposable);
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

function createWAST(terminal : vscode.Terminal, source : string, target : string)
{
    selectTerminal(terminal);
    
    // > eosiocpp -o targetName fileName
    terminal.sendText(eosiocppPath + ` -o ${target} ${source}`);
    vscode.window.showInformationMessage(eosiocppPath + ` -o ${target} ${source}`);
    setWASTSource(source);
}

function createABI(terminal : vscode.Terminal, source : string, target : string)
{
    selectTerminal(terminal);
    
    // > eosiocpp -g targetName fileName
    terminal.sendText(eosiocppPath + ` -g ${target} ${source}`);
    vscode.window.showInformationMessage(eosiocppPath + ` -g ${target} ${source}`);
    setABISource(source);
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
    console.log(configPath);

    return configPath;
}

function getConfig() : any
{
    const configPath = getConfigPath();

    let defaultConfig = 
`{
    "eosiocppPath": "${eosiocppPath}",
    "nodeosPath": "${nodeosPath}",
    "cleosPath": "${cleosPath}"
}`;

    if (!fs.existsSync(configPath))
    {
        // var arr = fs.readdirSync(".");
        console.log('config file is NOT existed. create new one.');
        
        fs.writeFileSync(configPath, defaultConfig, 'utf8');
    }

    if (!fs.existsSync(configPath))
        return undefined;
    
    console.log('config file is existed.');

    let jsonContents = fs.readFileSync(configPath, 'utf8');
    if (jsonContents.length == 0) {
        fs.writeFileSync(configPath, defaultConfig, 'utf8');
        jsonContents = defaultConfig;
    }

    let obj = undefined;
    try
    {
        obj = JSON.parse(jsonContents);
    }
    catch(error)
    {
        vscode.window.showErrorMessage(`Invalid 'eoscode.config.json' : ${error}`);
    }
    
    return obj;
}

function loadConfig()
{
    let configObj = getConfig();
    
    if (configObj.eosiocppPath)
    {
        eosiocppPath = configObj.eosiocppPath;
    }
    else
    {
        configObj.eosiocppPath = eosiocppPath;
    }
    
    if (configObj.nodeosPath)
    {
        nodeosPath = configObj.nodeosPath;
    }
    else
    {
        configObj.nodeosPath = nodeosPath;
    }
    
    if (configObj.cleosPath)
    {
        cleosPath = configObj.cleosPath;
    }
    else
    {
        configObj.cleosPath = cleosPath;
    }

    if (configObj.abiSource)
    {
        abiSource = configObj.abiSource;
    }
    else
    {
        configObj.abiSource = abiSource;
    }

    if (configObj.wastSource)
    {
        wastSource = configObj.wastSource;
    }
    else
    {
        configObj.wastSource = wastSource;
    }

    saveConfig(configObj);
}

function saveConfig(obj : any)
{
    const configPath = getConfigPath();
    const configContents = JSON.stringify(obj, null, 4);

    fs.writeFileSync(configPath, configContents, 'utf8');
}

function setABISource(filePath : string)
{
    abiSource = filePath;
    
    let obj = getConfig();
    obj.abiSource = abiSource;
    saveConfig(obj);
}

function setWASTSource(filePath : string)
{
    wastSource = filePath;
    
    let obj = getConfig();
    obj.wastSource = wastSource;
    saveConfig(obj);
}