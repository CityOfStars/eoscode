# EOSCode README

EOSCode is VSCode Extension to help your `eos` development.
All right reserved by @CityOfStars and @unlimited-network.

## Features

* Provides ABI WebView. You no longer need to `push action` at the terminal.
* Build `.wasm`, `.abi` and `set contract` to eos account by ONE-COMMAND.
* Unlock wallet in VSCode.

## Requirements

* node.js 10.0 &uarr;
* vscode 1.27 &uarr;
* macOS(High Sierra)
* ubuntu(18.04)

## Extension Settings

1. install `nodejs` and `npm`.
2. install vscode. 
3. clone EOSCode and build with vscode.
4. copy eoscode folder into below path.
  * macOS : ~/.vscode/extensions
  * Linux : ~/.vscode/extensions

## Usage

1. Open eos contract project.
2. Open .wast build target(.cpp) file.
3. Input ⇧⌘P.
4. Type `eoscode`
5. Select `EOSCode : BuildTarget : Create .wasm With Current File`
6. Open .abi build target(.hpp) file.
7. Input ⇧⌘P.
8. Type `eoscode`
9. Select `EOSCode : BuildTarget : Create .abi With Current File`

And then you can use `EOSCode : IntegratedBuild : Build Contract (create .wast and .abi)` command.

* on working...

## Commands

* BuildTarget : Create .abi With Current File
* Contract : Input Contract Account
* Contract : Input Contract Option
* Contract : Set Contract To Account
* Contract : Show Contract Interface
* IntegratedBuild : Build Contract (create .wasm and .abi)
* IntegratedBuild : Build And Set Contract (contract account is required.)
* Wallet : Unlock Wallet

## Working Features ...

* supporting ubuntu on windows
* porting to eosio.cdt


