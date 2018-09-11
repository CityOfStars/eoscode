'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { EOSCode } from './EOSCode/EOSCode';

var eoscode : EOSCode;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let terminal = vscode.window.createTerminal('eoscode terminal');
    context.subscriptions.push(terminal);

    eoscode = new EOSCode(context, terminal);
    eoscode.init();
}

// this method is called when your extension is deactivated
export function deactivate() {
}