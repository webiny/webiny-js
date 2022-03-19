// noinspection JSVoidFunctionReturnValueUsed

import webpack from "webpack";
import fs from "fs-extra";
import { resolve, dirname } from "path";
import readJson from "read-json-sync";
import { watch } from "chokidar";
// import getPackages from "get-yarn-workspaces";

function watchAndRebuild(files: Map<string, string>) {
    const filePaths = Array.from(files.values());
    const watcher = watch(filePaths);

    //watcher.add('new-file');

    watcher
        .on("change", path => {
            console.log("changed", path);
            // TODO BUILD
        })
        .on("error", error => {
            console.log(`Watcher error: ${error}`);
        })
        .on("ready", () => {
            console.log("Initial scan complete. Ready for changes.");
            console.log("Watched files", watcher.getWatched());
        });
}

export class ModuleGraphPlugin {
    apply(compiler: webpack.Compiler) {
        const className = this.constructor.name;
        const skip = [".artifacts", "node_modules", "data:"];
        const toWatch: Map<string, string> = new Map();

        // compiler.hooks.watchRun.tap(className, watching => {
        //     console.log(watching.modifiedFiles);
        // });

        compiler.hooks.done.tap(className, () => {
            console.log("Hook DONE");
            // const workspaces = (getPackages() as string[])
            //     .filter(wp => wp.includes("/packages-v6/"))
            //     .filter(wp => toWatch.some(fp => fp.startsWith(wp)));
            // console.log(workspaces);
            watchAndRebuild(toWatch);
        });

        compiler.hooks.compilation.tap(className, compilation => {
            compilation.hooks.finishModules.tap(className, modules => {
                console.log("compilation.hooks.finishModules");
                const normalModules = modules as Iterable<webpack.NormalModule>;
                Array.from(normalModules)
                    .filter(m => !toWatch.has(m.resource))
                    .filter(m => {
                        return m.resource && !skip.some(part => m.resource.includes(part));
                    })
                    .forEach(m => {
                        // Map module file to original source file
                        const sourceMap = `${m.resource}.map`;
                        if (fs.existsSync(sourceMap)) {
                            const content = readJson(sourceMap);
                            toWatch.set(
                                m.resource,
                                resolve(dirname(sourceMap), content.sources[0])
                            );
                        } else {
                            toWatch.set(m.resource, m.resource);
                        }
                    });
            });
        });
    }
}
