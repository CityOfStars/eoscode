'use strict';

import * as fs from 'fs';

export class ABIInterfaceMgr {

    public getABIWebviewContent(abiPath : string, contractUser : string) {
        let abiContents = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
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
        `;
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
        `;
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
        user account : <input type="text" name="account" value="${contractUser}" />
    </form><br/><br/>
    <h1>Functions</h1><hr/>
    `;
        let structs = abiContents.structs;
        for (let i = 0; i < structs.length; i++) {
            let obj = structs[i];
            //console.log(obj['name']);   // structs names
            let functionName = obj['name'];
            //console.log("rammerchoi : " + functionNames.indexOf('rammerchoi'))
            if (functionNames.indexOf(functionName) === -1) {
                continue;
            }

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
`;
        }

        contents += tableContents;

        contents += `</body></html>`;

        return contents;
    }
}