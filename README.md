# EOSCode README

EOSCode is VSCode Extension to help your `eos` development.
All right reserved by @CityOfStars and @unlimited-network.

## Features

* Provides ABI WebView. You no longer need to `push action` at the terminal.
* Build `.wast`, `.abi` and `set contract` to eos account by ONE-COMMAND.
* Unlock wallet in VSCode.

## Requirements

* node.js 10.0 &uarr;
* vscode 1.27 &uarr;
* Only tested in macOS(High Sierra)

## Extension Settings

1. install node.js with `brew`.
2. install vscode. 
3. clone EOSCode and build with vscode.
4. copy eoscode folder into below.
  * Windows : %USERPROFILE%\.vscode\extensions
  * macOS : ~/.vscode/extensions
  * Linux : ~/.vscode/extensions

## Usage

1. Open eos contract project.
2. Open .wast build target(.cpp) file.
3. Input ⇧⌘P.
4. Type `eoscode`
5. Select `EOSCode : BuildTarget : Create .wast With Current File`
6. Open .abi build target(.hpp) file.
7. Input ⇧⌘P.
8. Type `eoscode`
9. Select `EOSCode : BuildTarget : Create .abi With Current File`

And then you can use `EOSCode : IntegratedBuild : Build Contract (create .wast and .abi)` command.

* on working...
