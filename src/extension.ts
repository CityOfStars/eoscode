'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path'

// default configs
let configs = 
{
    eosPath: {
        eosiocppPath: "eosiocpp",
        nodeosPath: "nodeos",
        cleosPath: "cleos"
    },
    buildTarget: {
        wastSource: "",
        abiSource: ""
    },
    contract: {
        account: "",
        option: "",
        dir: vscode.workspace.rootPath
    }
};

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
        
        const onlyName = getOnlyFileName(filePath);
        const ext = path.extname(filePath);
        if (!wastTargets.find((e) => { return e == ext; }))
        {
            vscode.window.showErrorMessage(`Invalid file extension : "${ext}". expected : ` + wastTargets);
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

        const onlyName = getOnlyFileName(filePath);
        const ext = path.extname(filePath);
        if (!abiTargets.find((e) => { return e == ext; }))
        {
            vscode.window.showErrorMessage(`Invalid file extension : "${ext}". expected : ` + abiTargets);
            return;    
        }

        const targetName = onlyName + ".abi";
        createABI(terminal, filePath, targetName);
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('extension.buildContract', () => 
    {
        const wastSource = configs.buildTarget.wastSource;
        const abiSource = configs.buildTarget.abiSource;
        if (wastSource.length == 0)
        {
            vscode.window.showErrorMessage(`Please configure .wast Build Target`);
            return;
        }

        if (abiSource.length == 0)
        {
            vscode.window.showErrorMessage(`Please configure .abi Build Target`);
            return;
        }

        const wastSourceName = getOnlyFileName(wastSource);
        const wastSourceExt = path.extname(wastSource);
        if (!wastTargets.find((e) => { return e == wastSourceExt; }))
        {
            vscode.window.showErrorMessage(`Invalid file extension : "${wastSourceExt}". expected : ` + wastTargets);
            return;    
        }

        const abiSourceName = getOnlyFileName(abiSource);
        const abiSourceExt = path.extname(abiSource);
        if (!abiTargets.find((e) => { return e == abiSourceExt; }))
        {
            vscode.window.showErrorMessage(`Invalid file extension : "${abiSourceExt}". expected : ` + abiTargets);
            return;    
        }

        const wastTargetName = wastSourceName + ".wast";
        createWAST(terminal, wastSource, wastTargetName);

        const abiTargetName = abiSourceName + ".abi";
        createABI(terminal, abiSource, abiTargetName);

        setContract(terminal);
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

// > eosiocpp -o targetName fileName
function createWAST(terminal : vscode.Terminal, source : string, target : string)
{
    selectTerminal(terminal);
    
    const eosiocppPath = configs.eosPath.eosiocppPath;
    terminal.sendText(eosiocppPath + ` -o ${target} ${source}`);
    vscode.window.showInformationMessage(eosiocppPath + ` -o ${target} ${source}`);
    setWASTSource(source);
}

// > eosiocpp -g targetName fileName
function createABI(terminal : vscode.Terminal, source : string, target : string)
{
    selectTerminal(terminal);
    
    const eosiocppPath = configs.eosPath.eosiocppPath;
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

function setABISource(filePath : string)
{
    configs.buildTarget.abiSource = filePath;
    saveConfig(configs);
}

function setWASTSource(filePath : string)
{
    configs.buildTarget.wastSource = filePath;
    saveConfig(configs);
}

function getOnlyFileName(filePath : string)
{
    let fileBaseName = path.basename(filePath);

    let pos = fileBaseName.lastIndexOf('.');
    if(pos != fileBaseName.length)
    {
        return fileBaseName.slice(0, pos);
    }
    
    return fileBaseName;
}

function setContract(terminal : vscode.Terminal)
{
    const account = configs.contract.account;
    const option = configs.contract.option;
    const dir = configs.contract.dir;

    selectTerminal(terminal);
    
    const cleosPath = configs.eosPath.cleosPath;

    const cmd = cleosPath + ` set contract ${option} ${account} ${dir}`;
    terminal.sendText(cmd);
    vscode.window.showInformationMessage(cmd);
}