'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path'

let eosiocppPath = "eosiocpp";
let nodeosPath = "nodeos";
let cleosPath = "cleos";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let terminal = vscode.window.createTerminal('eoscode terminal');
    context.subscriptions.push(terminal);

    let wastTargets : string[] = ['cpp'];
    let abiTargets : string[] = ['hpp', 'h', 'cpp'];

    let rootDir = vscode.workspace.rootPath;
    if (!rootDir)
    {
        return;
    }
    
    console.log('Congratulations, your extension "eoscode" is now active!');
    
    const configName = 'eoscode.config.json'
    const configPath = path.join(rootDir, configName);
    console.log(configPath);
    
    if (fs.existsSync(configPath))
    {
        console.log('config file is existed.');

        let jsonContents = fs.readFileSync(configPath, 'utf8');
        if(jsonContents.length != 0)
        {
            let obj = JSON.parse(jsonContents);

            try 
            {
                console.log(obj.eosiocppPath);    
            }
            catch(error)
            {
                console.error(error);
            }
            
            try 
            {
                console.log(obj.nodeosPath);
            }
            catch(error) 
            {
                console.error(error);
            }
            
            try 
            {
                console.log(obj.cleosPath);
            }
            catch(error) 
            {
                console.error(error);
            }
        }
    }
    else
    {
        // var arr = fs.readdirSync(".");
        console.log('config file is NOT existed.');
    }

    let disposable = vscode.commands.registerCommand('extension.createWAST', () => {
        const fileName = getCurrentFileName();
        const onlyName = path.basename(fileName);
        const ext = path.extname(fileName);
        if(!wastTargets.find((e) => { return e == ext; }))
        {
            vscode.window.showInformationMessage(`Invalid file extension : .${ext} expected : ` + wastTargets);
            return;    
        }

        const targetName = onlyName + ".wast";

        // create or open terminal
        // > eosiocpp -o targetName fileName 

        createWAST(terminal, fileName, targetName);
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('extension.createABI', () => {
        const fileName = getCurrentFileName();
        const onlyName = path.basename(fileName);
        const ext = path.extname(fileName);
        if(!abiTargets.find((e) => { return e == ext; }))
        {
            vscode.window.showInformationMessage(`Invalid file extension : .${ext} expected : ` + wastTargets);
            return;    
        }

        const targetName = onlyName + ".abi";

        // create or open terminal
        createABI(terminal, fileName, targetName);
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

function getCurrentFileName() : string
{
    let fileName = getCurrentFilePath();
    fileName = fileName.replace('\\', '/');
    let arr = fileName.split('/');
    if(arr.length == 0)
        return fileName;

    return arr[arr.length - 1];
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
}

function createABI(terminal : vscode.Terminal, source : string, target : string)
{
    selectTerminal(terminal);
    
    // > eosiocpp -g targetName fileName
    terminal.sendText(eosiocppPath + ` -g ${target} ${source}`);
    vscode.window.showInformationMessage(eosiocppPath + ` -g ${target} ${source}`);
}