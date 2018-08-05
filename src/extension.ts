'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let terminal = vscode.window.createTerminal('eoscode terminal');
    let wastTargets : string[] = ['cpp'];
    let abiTargets : string[] = ['hpp', 'h', 'cpp'];

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "eoscode" is now active!');

    let disposable = vscode.commands.registerCommand('extension.createWAST', () => {
        const fileName = getCurrentFileName();
        const onlyName = getFileOnlyName(fileName);
        const ext = getFileExtension(fileName);
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
        const onlyName = getFileOnlyName(fileName);
        const ext = getFileExtension(fileName);
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

function getFileExtension(fileName : string) : string
{
    let arr = fileName.split('.');
    if (arr.length !== 0)
    {
        return arr[arr.length - 1];
    }
    return '';
}

function getFileOnlyName(fileName : string) : string
{
    let arr = fileName.split('.');
    if (arr.length >= 2)
    {
        return arr[arr.length - 2];
    }
    return '';
}

function selectTerminal(terminal : vscode.Terminal)
{
    terminal.show();
}

function createWAST(terminal : vscode.Terminal, source : string, target : string)
{
    selectTerminal(terminal);
    
    // > eosiocpp -o targetName fileName
    terminal.sendText(`eosiocpp -o ${target} ${source}`);
    vscode.window.showInformationMessage(`eosiocpp -o ${target} ${source}`);
}

function createABI(terminal : vscode.Terminal, source : string, target : string)
{
    selectTerminal(terminal);
    
    // > eosiocpp -g targetName fileName
    terminal.sendText(`eosiocpp -g ${target} ${source}`);
    vscode.window.showInformationMessage(`eosiocpp -g ${target} ${source}`);
}