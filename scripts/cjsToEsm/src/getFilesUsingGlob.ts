import glob from "fast-glob";

/**
 * Get all .js, .ts, and .tsx files using glob
 */
export function getFilesUsingGlob(rootDir: string | string[]): string[] {
    const matchedFiles: string[] = [];
    const request = Array.isArray(rootDir) ? rootDir : [rootDir];
    const globs = request
        .map((rootDir: string) => {
            return [
                `${rootDir}/src/**/*.tsx`,
                // `${rootDir}/**/*.test.tsx?`,
                `${rootDir}/src/**/*.ts`,
                // `${rootDir}/**/*.test.ts`,
                `${rootDir}/src/**/*.js`
                // `${rootDir}/**/*.test.js`
            ];
        })
        .flat();

    // Use `glob` to pattern match files
    glob.sync(globs, {
        cwd: process.cwd(),
        absolute: true,
        ignore: [
            "node_modules/**",
            "**/*.d.ts",
            "**/webiny.config.js",
            "**/webiny.config.ts",
            "**/dist/**"
        ]
    }).forEach(file => {
        matchedFiles.push(file);
    });

    return matchedFiles;
}
