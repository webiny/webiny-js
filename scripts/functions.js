/* eslint-disable */
const path = require("path");
const listFunctions = require("./functions/listFunctions");
const logFunctions = require("./functions/logFunctions");
const nodemon = require("nodemon");
const chalk = require("chalk");
const tcpPortUsed = require("tcp-port-used");

const args = process.argv.slice(2);

const options = {
    nodemon: [],
    script: {
        "--also-watch": null,
        "--port": 9000
    }
};

args.forEach(arg => {
    for (let key in options.script) {
        if (arg.startsWith(key)) {
            options.script[key] = arg.replace(`${key}=`, "");
            return true;
        }
    }
    options.nodemon.push(arg);
});

const command = [...options.nodemon, "scripts/functions/runFunctions.js"];

// "--also-watch" argument:
let watch = listFunctions().map(fn => fn.root + "/**/*.js");
if (options.script["--also-watch"]) {
    watch.push(path.join(process.cwd(), options.script["--also-watch"]));
}

watch.forEach(item => command.unshift(`-w ${item}`));

// "--port" argument:
command.push(`--port=${options.script["--port"]}`);

// Check port:
tcpPortUsed.check(options.script["--port"]).then(inUse => {
    if (inUse) {
        console.log(chalk.red(`Port ${options.script["--port"]} already in use.`));
        process.exit(1);
    }

    logFunctions();
    nodemon(command.join(" "))
        .on("quit", process.exit)
        .on("restart", function() {
            console.log(chalk.green("Restarting..."));
        });
});
