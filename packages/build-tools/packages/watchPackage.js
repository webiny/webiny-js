import path from "path";
import fs from "fs/promises";
import { transformFileAsync } from "@babel/core";
import chokidar from "chokidar";

let compilationQueue = [];
let debounceTimer = null;
const DEBOUNCE_DELAY = 1000; // 1 second

const flushCompilationQueue = () => {
    if (compilationQueue.length > 0) {
        if (compilationQueue.length === 1) {
            console.log(`Successfully compiled ${compilationQueue[0]}.`);
        } else {
            console.log(`Successfully compiled ${compilationQueue.length} files.`);
        }
        compilationQueue = [];
    }
};

const logCompilation = inputPathRelative => {
    compilationQueue.push(inputPathRelative);

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        flushCompilationQueue();
    }, DEBOUNCE_DELAY);
};

const compileFile = async (cwd, inputPath, outputPath) => {
    const inputPathRelative = path.relative(cwd, inputPath);

    const result = await transformFileAsync(inputPath, {
        configFile: path.join(cwd, ".babelrc.js"),
        sourceMaps: true
    });

    if (!result || !result.code) {
        throw new Error(`Failed to compile: ${inputPath}`);
    }

    // Write compiled file
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, result.code);

    // Write source map
    if (result.map) {
        await fs.writeFile(`${outputPath}.map`, JSON.stringify(result.map));
    }

    logCompilation(inputPathRelative);
};

const srcToDist = filePath =>
    path.join(
        filePath
            .replace(`${path.sep}src${path.sep}`, `${path.sep}dist${path.sep}`)
            .replace(/\.(ts|tsx)$/, ".js")
    );

export default async options => {
    const srcDir = path.join(options.cwd, "src");

    // Watch the src directory recursively for new files
    const watcher = chokidar.watch(srcDir, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: false
    });

    const isTsFile = filePath => /\.(ts|tsx)$/.test(filePath);

    watcher.on("add", async srcPath => {
        if (!isTsFile(srcPath)) {
            return;
        }

        const distPath = srcToDist(srcPath);

        try {
            await compileFile(options.cwd, srcPath, distPath);
        } catch (err) {
            console.error("Error compiling:", err);
        }
    });

    watcher.on("change", async srcPath => {
        if (!isTsFile(srcPath)) {
            return;
        }

        const distPath = srcToDist(srcPath);

        try {
            await compileFile(options.cwd, srcPath, distPath);
        } catch (err) {
            console.error("Error compiling:", err);
        }
    });

    console.log("Watching for changes...");
};
