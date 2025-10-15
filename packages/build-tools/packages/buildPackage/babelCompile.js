import fs from "fs";
import { dirname, extname, join, parse, relative } from "path";
import * as babel from "@babel/core";
import glob from "fast-glob";

const BABEL_COMPILE_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];

const withSourceMapUrl = (file, code) => {
    const { name } = parse(file);
    return [code, "", `//# sourceMappingURL=${name}.js.map`].join("\n");
};

const getDistCopyFilePath = ({ file, cwd }) => {
    const relativeDir = relative(cwd, file);
    return join(cwd, relativeDir.replace("src", "dist"));
};

const getDistFilePaths = ({ file, cwd }) => {
    const { dir, name } = parse(file);

    const relativeDir = relative(cwd, dir);

    const code = join(cwd, relativeDir.replace("src", "dist"), name + ".js");
    const map = join(cwd, relativeDir.replace("src", "dist"), name + ".js.map");
    return { code, map };
};

export const babelCompile = async ({ cwd }) => {
    // We're passing "*.*" just because we want to copy all files that cannot be compiled.
    // We want to have the same behaviour that the Babel CLI's "--copy-files" flag provides.
    const pattern = join(cwd, "src/**/*.*").replace(/\\/g, "/");
    const files = glob.sync(pattern, {
        onlyFiles: true,
        dot: true
    });

    const compilations = [];
    const copies = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (BABEL_COMPILE_EXTENSIONS.includes(extname(file))) {
            compilations.push(
                babel
                    .transformFileAsync(file, {
                        cwd,
                        sourceMaps: true
                    })
                    .then(results => [file, results])
            );
        } else {
            copies.push(
                new Promise((resolve, reject) => {
                    try {
                        const destPath = getDistCopyFilePath({ file, cwd });
                        if (!fs.existsSync(dirname(destPath))) {
                            fs.mkdirSync(dirname(destPath), { recursive: true });
                        }

                        fs.copyFileSync(file, destPath);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                })
            );
        }
    }

    // At this point, just wait for compilations to be completed, so we can proceed with writing the files ASAP.
    await Promise.all(compilations);

    const writes = [];
    for (let i = 0; i < compilations.length; i++) {
        const [file, result] = await compilations[i];
        const { code, map } = result;

        const paths = getDistFilePaths({ file, cwd });
        fs.mkdirSync(dirname(paths.code), { recursive: true });

        // Save the compiled JS file.
        writes.push(fs.promises.writeFile(paths.code, withSourceMapUrl(file, code), "utf8"));

        // Save source maps file.
        const mapJson = JSON.stringify(map);
        writes.push(fs.promises.writeFile(paths.map, mapJson, "utf8"));
    }

    // Wait until all files have been written to disk.
    return Promise.all([...writes, ...copies]);
};
