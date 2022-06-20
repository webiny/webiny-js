import { createBuildPackage, createWatchPackage } from "@webiny/project-utils";
import fs from "fs";
import {join} from "path";
import glob from "fast-glob";
import normalize from "normalize-path";

const cwd = normalize(__dirname);

export default {
    commands: {
        build: (...args) => {
            const start = new Date();

            const { cwd } = options;
            options.logs !== false && console.log("Deleting existing build files...");
            rimraf.sync(join(cwd, "./dist"));
            rimraf.sync(join(cwd, "*.tsbuildinfo"));

            options.logs !== false && console.log("Building...");
            await Promise.all([tsCompile(options), babelCompile(options)]);

            options.logs !== false && console.log("Copying meta files...");
            copyToDist("package.json", options);
            copyToDist("LICENSE", options);
            copyToDist("README.md", options);

            const duration = (new Date() - start) / 1000;
            options.logs !== false && console.log(`Done! Build finished in ${duration + "s"}.`);

            return { duration };

            return;

            const entries = glob.sync(`${cwd}/src/**/webiny.config.ts`);

            return Promise.all(entries.map(item => import(item))).then(res => {
                return Promise.all(
                    res.map(({ default: defaultExport }) => {
                        return defaultExport.commands.build(...args);
                    })
            §    );
            });
        }
    }
};

const copyToDist = (path, { cwd, logs }) => {
    const from = join(cwd, path);
    const to = join(cwd, "dist", path);
    if (fs.existsSync(from)) {
        fs.copyFileSync(from, to);
        logs !== false && console.log(`Copied ${path}.`);
    }
};
