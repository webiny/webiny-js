import path from "path";
import chalk from "chalk";

export const printBuildStats =
    ({ cwd, label = "build", extensions = [".js", ".mjs", ".css"] }) =>
    ({ stats }) => {
        if (!stats) {
            return;
        }

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
            .filter(asset => extensions.some(ext => asset.name.endsWith(ext)))
            .sort((a, b) => a.size - b.size);

        // Print header with blue color
        console.log(
            `\n${chalk.blue(`File (${label})`.padEnd(50))}${chalk.blue("Size".padStart(11))}`
        );

        let totalSize = 0;
        for (const asset of sortedAssets) {
            const fileName = path.basename(asset.name);
            const sizeKB = (asset.size / 1024).toFixed(1);
            totalSize += asset.size;

            // Print filename in cyan
            console.log(`${chalk.cyan(fileName.padEnd(50))}${sizeKB.padStart(10)} kB`);
        }

        const totalSizeKB = (totalSize / 1024).toFixed(1);
        console.log(`\n${chalk.magenta("Total:".padEnd(50))}${totalSizeKB.padStart(10)} kB\n`);
    };
