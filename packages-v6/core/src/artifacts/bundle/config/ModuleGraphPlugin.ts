// noinspection JSVoidFunctionReturnValueUsed

import webpack from "webpack";
import fs from "fs-extra";
import { resolve, dirname } from "path";
import readJson from "read-json-sync";
import { watch } from "chokidar";
import { tsCompile, babelCompile } from "./buildFile";
// @ts-ignore
import getPackages from "get-yarn-workspaces";
import { WebpackError } from "webpack";
import { useWebiny } from "../../../webiny";
import { Webiny } from "../../../types";

const workspaces = getPackages() as string[];

export class ModuleGraphPlugin {
    private toWatch: Set<string> = new Set();
    private fileMap: Map<string, string> = new Map();
    private compilation: webpack.Compilation | null = null;
    private devServerTap: { fn: Function } | null = null;
    private checkTs: null | (() => Promise<void>) = null;
    private webiny: Webiny;

    constructor() {
        this.webiny = useWebiny();
    }

    private async buildFile(path: string) {
        const file = path.replace(/\\/g, "/");
        this.webiny.logger.debug("Changed file", this.webiny.logger.debug.hl(file));
        const workspace = workspaces.find(workspace => file.startsWith(workspace));

        if (!workspace) {
            this.webiny.logger.warning(`Workspace not found! Can't build file.`);
            return;
        }

        const destination = this.fileMap.get(file);
        if (!destination) {
            this.webiny.logger.warning(`Destination for ${file} was not found.`);
            return;
        }

        try {
            await babelCompile({ workspace, source: file, destination });
            if (file.endsWith(".ts") || file.endsWith(".tsx")) {
                this.checkTs = async () => {
                    if (!this.compilation) {
                        return;
                    }

                    this.webiny.logger.debug(
                        `Checking types for ${this.webiny.logger.debug.hl(file)}...`
                    );
                    try {
                        await tsCompile({ workspace, source: file });
                    } catch (err) {
                        this.compilation.errors.push(this.formatError(file, err));
                    }
                };
            }
        } catch (err) {
            console.log(err);
            this.showError(path, err);
        }
    }

    private formatError(file: string, err: Error): WebpackError {
        const error = new WebpackError(err.message);
        error.hideStack = true;
        error.file = file;
        return error;
    }

    private showError(file: string, err: Error) {
        if (!this.devServerTap || !this.compilation) {
            return;
        }
        const error = this.formatError(file, err);

        // @ts-ignore
        const stats = this.compilation.getStats();
        stats.compilation.errors.push(error);
        this.devServerTap.fn(stats);
    }

    apply(compiler: webpack.Compiler) {
        const className = this.constructor.name;
        const skip = [".artifacts", "node_modules", "data:"];

        const watcher = watch([]);
        watcher
            .on("change", path => {
                this.buildFile(path);
            })
            .on("error", error => {
                console.log(`Watcher error: ${error}`);
            });

        compiler.hooks.done.intercept({
            register: tap => {
                if (tap.name === "webpack-dev-server" && tap.type === "sync") {
                    this.devServerTap = tap;
                }
                return tap;
            }
        });

        compiler.hooks.afterCompile.tapPromise(className, async () => {
            if (this.checkTs) {
                await this.checkTs();
            }
        });

        compiler.hooks.compilation.tap(className, compilation => {
            this.compilation = compilation;
            compilation.hooks.finishModules.tap(className, modules => {
                const normalModules = modules as Iterable<webpack.NormalModule>;
                Array.from(normalModules)
                    .filter(m => {
                        return m.resource && !skip.some(part => m.resource.includes(part));
                    })
                    .map(m => m.resource.replace(/\\/g, "/"))
                    .filter(m => !this.toWatch.has(m))
                    .forEach(file => {
                        // Map module file to original source file
                        const sourceMap = `${file}.map`;
                        if (fs.existsSync(sourceMap)) {
                            const content = readJson(sourceMap);
                            const originalFile = resolve(
                                dirname(sourceMap),
                                content.sources[0]
                            ).replace(/\\/g, "/");

                            this.fileMap.set(file, originalFile);
                            this.fileMap.set(originalFile, file);
                            this.toWatch.add(originalFile);
                            watcher.add(originalFile);
                        } else {
                            this.toWatch.add(file);
                            watcher.add(file);
                        }
                    });
            });
        });
    }
}
