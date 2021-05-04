const chalk = require("chalk");
const clearConsole = require("react-dev-utils/clearConsole");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const typescriptFormatter = require("./typescriptFormatter");
const formatWebpackMessages = require("./formatWebpackMessages");
const isInteractive = process.stdout.isTTY;

let isFirstCompile = true;
let tsMessagesPromise;
let tsMessagesResolver;

module.exports.applyCompilerHooks = (compiler, { appName = "React app", devSocket, urls }) => {
    compiler.hooks.beforeCompile.tap("beforeCompile", () => {
        tsMessagesPromise = new Promise(resolve => {
            tsMessagesResolver = msgs => resolve(msgs);
        });
    });

    ForkTsCheckerWebpackPlugin.getCompilerHooks(compiler).waiting.tap("Webiny", () => {
        console.log(chalk.yellow("Files successfully emitted, waiting for typecheck results..."));
    });

    ForkTsCheckerWebpackPlugin.getCompilerHooks(compiler).issues.tap("Webiny", issues => {
        const format = message => `${message.file}\n${typescriptFormatter(message, true)}`;

        tsMessagesResolver({
            errors: issues.filter(msg => msg.severity === "error").map(format),
            warnings: issues.filter(msg => msg.severity === "warning").map(format)
        });
    });

    compiler.hooks.invalid.tap("invalid", () => {
        if (isInteractive) {
            clearConsole();
        }
        console.log("Compiling...");
    });

    compiler.hooks.done.tap("done", async stats => {
        isFirstCompile = false;

        if (isInteractive) {
            clearConsole();
        }

        const statsData = stats.toJson({
            all: false,
            warnings: true,
            errors: true
        });

        if (statsData.errors.length === 0) {
            const messages = await tsMessagesPromise;
            statsData.errors.push(...messages.errors);
            statsData.warnings.push(...messages.warnings);

            // Push errors and warnings into compilation result
            // to show them after page refresh triggered by user.
            stats.compilation.errors.push(...messages.errors);
            stats.compilation.warnings.push(...messages.warnings);

            if (messages.errors.length > 0) {
                devSocket.errors(messages.errors);
            } else if (messages.warnings.length > 0) {
                devSocket.warnings(messages.warnings);
            }

            if (isInteractive) {
                clearConsole();
            }
        }

        const messages = formatWebpackMessages(statsData);
        const isSuccessful = !messages.errors.length && !messages.warnings.length;
        if (isSuccessful) {
            console.log(chalk.green("Compiled successfully!"));
        }
        if (isSuccessful && (isInteractive || isFirstCompile)) {
            printInstructions(appName, urls);
        }
        isFirstCompile = false;

        // If errors exist, only show errors.
        if (messages.errors.length) {
            // Only keep the first error. Others are often indicative
            // of the same problem, but confuse the reader with noise.
            if (messages.errors.length > 1) {
                messages.errors.length = 1;
            }
            console.log(chalk.red("Failed to compile.\n"));
            console.log(messages.errors.join("\n\n"));
            return;
        }

        // Show warnings if no errors were found.
        if (messages.warnings.length) {
            console.log(chalk.yellow("Compiled with warnings.\n"));
            console.log(messages.warnings.join("\n\n"));

            // Teach some ESLint tricks.
            console.log(
                "\nSearch for the " +
                    chalk.underline(chalk.yellow("keywords")) +
                    " to learn more about each warning."
            );
            console.log(
                "To ignore, add " +
                    chalk.cyan("// eslint-disable-next-line") +
                    " to the line before.\n"
            );
        }
    });
};

function printInstructions(appName, urls) {
    console.log();
    console.log(`You can now view ${chalk.bold(appName)} in the browser.`);
    console.log();

    if (urls.lanUrlForTerminal) {
        console.log(`  ${chalk.bold("Local:")}            ${urls.localUrlForTerminal}`);
        console.log(`  ${chalk.bold("On Your Network:")}  ${urls.lanUrlForTerminal}`);
    } else {
        console.log(`  ${urls.localUrlForTerminal}`);
    }

    console.log();
    console.log("Note that the development build is not optimized.");
    console.log(`To create a production build, use ${chalk.cyan("yarn build")}.`);
    console.log();
}
