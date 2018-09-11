'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {ConfigMgr} from './ConfigMgr';

export class EOSCode {
    public context: vscode.ExtensionContext;
    public terminal: vscode.Terminal;
    public configMgr = new ConfigMgr();
    constructor(context: vscode.ExtensionContext, terminal: vscode.Terminal) {
        this.context = context;
        this.terminal = terminal;
    }

    // todo@cityofstars - make private on finish refactoring
    public registerEOSCodeCommand(
        command: string,
        callback: (...args: any[]) => any) {
        let disposable = vscode.commands.registerCommand(command, () => {
            this.onPreCommand();
            callback.call(null);
        });
        this.context.subscriptions.push(disposable);
    }

    private onPreCommand() {
        this.configMgr.loadConfig();
    } 
    
}