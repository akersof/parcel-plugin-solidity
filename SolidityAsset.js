const path = require('path');
const util = require('util');
const {Asset} = require('parcel-bundler');
const fs = require('@parcel/fs');
const commandExists = require('command-exists');
const childProcess = require('child_process');
const exec = util.promisify(childProcess.execFile); //maybe use the promisify from parcel ?
const md5 = require('parcel-bundler/src/utils/md5');

let solcInstalled = false;
const COMBINED_FILENAME = "combined.json";

class SolidityAsset extends Asset {
    constructor(name, options) {
        super(name, options);
        this.type = 'js';
        console.log('SolidityAsset constructor called');
        console.log("basename", this.basename);
        console.log("relativename", this.relativeName);
        console.log("name", this.name);
        console.log("options.rootDir", options.rootDir);
    }

    process() {
        console.log("processing");
        // We don't want to process this asset if the worker is in a warm up phase
        // since the asset will also be processed by the main process, which
        // may cause errors since go also writes files
        if (this.options.isWarmUp) {
            return;
        }

        return super.process();
    }

    async getConfig() {
        console.log("get configuration");
        let config =(await super.getConfig(['.solrc', 'sol.config.js', 'package.json'])) || {};
        config = config.sol || config;

        let defaultOptions = {}
        let customCompilerOptions = config.compilerOptions || {};
        return config;
    }

    async parse(code) {
        console.log("i am parsed");
        // Install solc compiler
        await this.installSolc();
        await this.solcCompile();
        const contract_path = path.join(this.options.rootDir, "contracts");
        await fs.mkdirp(contract_path);
    }

    async installSolc() {
        if(solcInstalled) {
            return;
        }
        //Check for solc compiler
        try {
            await commandExists('solc');
        }catch(e) {
            throw new Error("solc solidity compiler is not installed. Visit https://solidity.readthedocs.io/en/latest/installing-solidity.html. Don't install the npm/Node.js package, but Docker or binary package")
        }
        solcInstalled = true;
    }

    async solcCompile() {
        // Get output filename
        //Directory in the cache for creating the combined.json file
        this.path = path.join(this.options.cacheDir, this.basename.slice(0, -4));
        await fs.mkdirp(this.path);
        let name = md5(this.name);
        //run solc to compile the code
        const args = [
            '--combined-json',
            'abi,bin',
            this.name,
            '--overwrite',
            '-o',
            this.path
        ];
        //At this point a combined.json file is in the cache.
        await exec('solc', args);
        const json = require(path.join(this.path, COMBINED_FILENAME));
        const contracts_json = json.contracts;
        console.log(contracts_json);
        //for(var key in contracts_json) {
        //    if((path.basename(key).split(':'))[0] === path.basename(this.name))
        //        console.log(contracts_json[key]);
        //}

    }

    async pretransform() {
        console.log("i am pretransformed");
    }

    collectDependencies() {
        console.log("collecting dependencies");
    }

    async generate() {
        console.log("generating");
        let config = await this.getConfig();
        return [
            {
                type: 'js',
                value: `let coucou = "${this.name}";`,
            },

        ];
    }
   // async postProcess(generated) {
    //    console.log("i am postProcessed");
    //}

}

module.exports = SolidityAsset;
