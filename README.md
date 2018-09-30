# EOSCode README

EOSCode is VSCode Extension to help your `eos` development.
All right reserved by @CityOfStars and @unlimited-network.

## Features

* Provides ABI WebView. You no longer need to `push action` at the terminal.
* Build `.wasm`, `.abi` and `set contract` to eos account by ONE-COMMAND.
* Unlock wallet in VSCode.

## Requirements

* eos 1.3.0
* node.js 10.0 &uarr;
* vscode 1.27 &uarr;
* macOS(High Sierra)
* ubuntu(18.04)
* windows 10 and WSL(Windows Subsystem for Linux) \* UBUNTU ONLY \*

## Extension Settings

1. install `nodejs`, `npm` and `eos` 1.3.0.
```
NOTE : If you use windows 10 and WSL, you must install 'eos' in ubuntu.
```
2. install vscode. 
3. clone EOSCode repository.

```
git clone https://github.com/CityOfStars/eoscode.git
```

4. install devDependencies.

```
cd eoscode
npm install
```

5. build eoscode(hotkey : `F5`).

6. copy eoscode (without `node_modules`) folder into below path.
  * windows : %USERPROFILE%\.vscode\extensions
  * macOS & Linux : $HOME/.vscode/extensions

## Usage

### Set Build Target
1. Open eos contract project.
2. Open .wasm build target(.cpp) file.
3. Input ⇧⌘P and type `eoscode`(or `.wasm`).
4. Select `EOSCode : BuildTarget : Create .wasm With Current File`
5. Open .abi build target(.hpp) file.
6. Input ⇧⌘P and type `eoscode`(or `.abi`).
7. Select `EOSCode : BuildTarget : Create .abi With Current File`

And then you can use `EOSCode : IntegratedBuild : Build Contract (create .wasm and .abi)` command.

### Unlock Wallet
1. Open `YOUR_WORKSPACE/eoscode.config.json`.
2. Check that `eosPath.cleosPath` and `eosPath.cleosOption` are correct.
3. Input ⇧⌘P and type `eoscode`(or `wallet`).
4. Select `EOSCode : Wallet : Unlock Wallet`.
5. Input your wallet password.

### Set Contract to Account
1. Do `Set Build Target` and `Unlock Wallet`.
2. Input ⇧⌘P and type `eoscode`(or `contract`).
3. Select `EOSCode : Contract : Set Contract To Account`
4. Type your contract account. (If you input account already, this step will be skipped.)

And then you can use `IntegratedBuild : Build And Set Contract` command.

### Show Contract Interface as Webview.
1. Do `Set Build Target` and `Set Contract to Account`.
2. Input ⇧⌘P and type `eoscode`(or `contract`).
3. Select `EOSCode : Contract : Show Contract Interface`.
4. You can use ABI in webview, that means you don't have to type `push action` commands on terminal.

## Commands

* BuildTarget : Create .wasm With Current File
* BuildTarget : Create .abi With Current File
* Contract : Input Contract Account
* Contract : Input Contract Option
* Contract : Set Contract To Account
* Contract : Show Contract Interface
* IntegratedBuild : Build Contract (create .wasm and .abi)
* IntegratedBuild : Build And Set Contract (contract account is required.)
* Wallet : Unlock Wallet

## Working Features ...

* porting to eosio.cdt


