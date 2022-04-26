import chalk from "chalk";
// @ts-ignore
import detect from "detect-port-alt";
import isRoot from "is-root";
// @ts-ignore
import prompts from "prompts";
import { getProcessForPort } from "./getProcessForPort";
import webpack from "webpack";
import { URLs } from "./prepareUrls";

const isInteractive = process.stdout.isTTY;

function clearConsole() {
    process.stdout.write(process.platform === "win32" ? "\x1B[2J\x1B[0f" : "\x1B[2J\x1B[3J\x1B[H");
}

export function printInstructions(appName: string, urls: URLs) {
    console.log();
    console.log(`You can now view ${chalk.bold(appName)} in the browser.`);
    console.log();

    console.log(`  ${chalk.bold("Local:")}            ${urls.localUrlForTerminal}`);
    console.log(`  ${chalk.bold("On Your Network:")}  ${urls.lanUrlForTerminal}`);

    console.log();
    console.log("Note that the development build is not optimized.");
    console.log(`To create a production build, use ` + `${chalk.cyan(`yarn build`)}.`);
    console.log();
}

interface CreateCompiler {
    appName: string;
    config: webpack.Configuration;
    urls: URLs;
    webpack: typeof webpack;
}

export function createCompiler({ appName, config, urls, webpack }: CreateCompiler) {
    // "Compiler" is a low-level interface to webpack.
    // It lets us listen to some events and provide our own custom messages.
    let compiler;
    try {
        compiler = webpack(config);
    } catch (err) {
        console.log(chalk.red("Failed to compile."));
        console.log();
        console.log(err.message || err);
        console.log();
        process.exit(1);
    }

    // "invalid" event fires when you have changed a file, and webpack is
    // recompiling a bundle. WebpackDevServer takes care to pause serving the
    // bundle, so if you refresh, it'll wait instead of serving the old one.
    // "invalid" is short for "bundle invalidated", it doesn't imply any errors.
    compiler.hooks.invalid.tap("invalid", () => {
        if (isInteractive) {
            clearConsole();
        }
    });

    let isFirstCompile = true;

    // "done" event fires when webpack has finished recompiling the bundle.
    // Whether or not you have warnings or errors, you will get this event.
    compiler.hooks.done.tap("done", async stats => {
        const statsData = stats.toJson({
            all: false,
            warnings: true,
            errors: true
        });

        if (isInteractive) {
            clearConsole();
        }

        if (statsData?.errors?.length) {
            console.log();
        }

        const isSuccessful = !statsData?.errors?.length && !statsData?.warnings?.length;

        if (isSuccessful && (isInteractive || isFirstCompile)) {
            printInstructions(appName, urls);
        }
        isFirstCompile = false;
    });

    return compiler;
}

export function choosePort(host: string, defaultPort: number) {
    return detect(defaultPort, host).then(
        (port: number) =>
            new Promise(resolve => {
                if (port === defaultPort) {
                    return resolve(port);
                }
                const message =
                    process.platform !== "win32" && defaultPort < 1024 && !isRoot()
                        ? `Admin permissions are required to run a server on a port below 1024.`
                        : `Something is already running on port ${defaultPort}.`;
                if (isInteractive) {
                    clearConsole();
                    const existingProcess = getProcessForPort(defaultPort);
                    const question = {
                        type: "confirm",
                        name: "shouldChangePort",
                        message:
                            chalk.yellow(
                                message +
                                    `${existingProcess ? ` Probably:\n  ${existingProcess}` : ""}`
                            ) + "\n\nWould you like to run the app on another port instead?",
                        initial: true
                    };
                    prompts(question).then(
                        ({ shouldChangePort }: { shouldChangePort: boolean }) => {
                            if (shouldChangePort) {
                                resolve(port);
                            } else {
                                resolve(null);
                            }
                        }
                    );
                } else {
                    console.log(chalk.red(message));
                    resolve(null);
                }
            }),
        (err: Error) => {
            throw new Error(
                [
                    chalk.red(`Could not find an open port at ${chalk.bold(host)}.`),
                    "\n",
                    "Network error message: " + err.message,
                    "\n"
                ].join("")
            );
        }
    );
}
