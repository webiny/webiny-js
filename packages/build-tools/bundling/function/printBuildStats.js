import path from "path";

// ANSI color codes
const colors = {
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m",
    reset: "\x1b[0m"
};

export const printBuildStats =
    cwd =>
    ({ stats }) => {
        if (!stats) return;

        const statsJson = stats.toJson({ assets: true, children: false });
        const assets = statsJson.assets || [];

        // Compute cleaner display path
        const projectRoot = process.cwd();
        const outputPath = statsJson.outputPath || path.join(cwd, "build");
        const webinyWorkspacePrefix = ".webiny/workspace/";
        let displayPath = path.relative(projectRoot, outputPath);

        if (displayPath.startsWith(webinyWorkspacePrefix)) {
            displayPath = displayPath.slice(webinyWorkspacePrefix.length);
        }

        // Sort assets by size for better readability
        const sortedAssets = assets
            .filter(asset => asset.name.endsWith(".mjs"))
            .sort((a, b) => a.size - b.size);

        // Print header with blue color
        console.log(
            `\n${colors.blue}File (node)${colors.reset}${"".padEnd(69)}${colors.blue}Size${colors.reset}`
        );

        let totalSize = 0;
        for (const asset of sortedAssets) {
            const fileName = path.basename(asset.name);
            const sizeKB = (asset.size / 1024).toFixed(1);
            totalSize += asset.size;

            // Print filename in cyan
            console.log(
                `${colors.cyan}${fileName.padEnd(79)}${colors.reset}${sizeKB.padStart(8)} kB`
            );
        }

        const totalSizeKB = (totalSize / 1024).toFixed(1);
        console.log(
            `\n${" ".repeat(79)}${colors.magenta}Total:${colors.reset}${totalSizeKB.padStart(8)} kB\n`
        );
    };
