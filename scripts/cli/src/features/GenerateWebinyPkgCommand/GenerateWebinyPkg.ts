import { ListPackagesService, UiService } from "../../abstractions/index.js";
import fs from "fs";
import path from "path";

const ambientDeclaration = (file: string) => !file.endsWith(".d.ts");

export interface GenerateWebinyPkg {
    execute(): Promise<void>;
}

export class GenerateWebinyPkg implements GenerateWebinyPkg {
    constructor(
        private ui: UiService.Interface,
        private listPackagesService: ListPackagesService.Interface
    ) {}

    async execute(): Promise<void> {
        this.ui.info("Generating %s package...", "webiny");

        const fullPackagesList = await this.listPackagesService.execute();

        const wbyPkg = fullPackagesList.find(pkg => pkg.packageJson.name === "webiny")!;

        // Reset exports in `webiny` package.json
        wbyPkg.packageJson.exports = {};

        const packagesWithExports = fullPackagesList
            .filter(pkg => pkg !== wbyPkg)
            .filter(pkg => Boolean(pkg.packageJson.webiny?.exports));

        // Clean up the src directory.
        const webinySrcPath = wbyPkg.paths.packageFolder.join("src").toString();
        if (fs.existsSync(webinySrcPath)) {
            fs.rmSync(webinySrcPath, { recursive: true, force: true });
        }

        // Copy static files from src-static to src (if src-static exists).
        const webinySrcStaticPath = wbyPkg.paths.packageFolder.join("src-static").toString();
        if (fs.existsSync(webinySrcStaticPath)) {
            this.copyDirectoryRecursive(webinySrcStaticPath, webinySrcPath);
            // Generate exports for static files
            this.generateExportsForStaticFiles(webinySrcStaticPath, webinySrcPath, wbyPkg);
        }

        for (const pkgWithExports of packagesWithExports) {
            this.ui.newLine();
            this.ui.info(`%s`, pkgWithExports.name);

            this.generateExportsForPkg(pkgWithExports, wbyPkg);
        }

        fs.writeFileSync(
            wbyPkg.paths.packageJsonFile.toString(),
            JSON.stringify(wbyPkg.packageJson, null, 2) + "\n"
        );

        this.ui.newLine();
        this.ui.success(`%s package generated.`, "webiny");
    }

    private generateExportsForStaticFiles(
        srcStaticPath: string,
        srcPath: string,
        wbyPkg: ListPackagesService.Package
    ) {
        const staticFiles = this.getAllFiles(srcStaticPath).filter(ambientDeclaration);

        for (const staticFile of staticFiles) {
            const relativePath = path.relative(srcStaticPath, staticFile);
            const exportKey = `./${relativePath}`;
            const exportValue = `./${relativePath}`;

            // @ts-ignore
            wbyPkg.packageJson.exports![exportKey] = exportValue;

            this.ui.debug(` Static file export: %s → %s`, exportKey, exportValue);
        }
    }

    private getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
        const files = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const file of files) {
            const fullPath = path.join(dirPath, file.name);

            if (file.isDirectory()) {
                this.getAllFiles(fullPath, arrayOfFiles);
            } else {
                arrayOfFiles.push(fullPath);
            }
        }

        return arrayOfFiles;
    }

    private generateExportsForPkg(
        pkgWithExports: ListPackagesService.Package,
        wbyPkg: ListPackagesService.Package
    ) {
        const pkgExports = pkgWithExports.packageJson.webiny?.exports!;

        for (const [basePkgFilePath, wbyPkgExportPathOrSettings] of Object.entries(pkgExports)) {
            // 1. Check if the file exists in the base package.
            const basePkgFullFilePath = pkgWithExports.paths.packageFolder
                .join("src", basePkgFilePath)
                .toString();

            if (!fs.existsSync(basePkgFullFilePath)) {
                this.ui.warning(
                    ` - Skipping export for %s as the file does not exist in the base package.`,
                    basePkgFilePath
                );
                continue;
            }

            // 2. Normalize export settings.
            let wbyPkgExportSettings: ListPackagesService.WebinyPackageExportSettings =
                typeof wbyPkgExportPathOrSettings === "string"
                    ? { exportPath: wbyPkgExportPathOrSettings }
                    : wbyPkgExportPathOrSettings;

            // 3. Create the export TS file.
            const exportPath = path
                .join(pkgWithExports.name, basePkgFilePath)
                .replace(".tsx", ".js")
                .replace(".ts", ".js");

            let namedExports = "*";
            if (wbyPkgExportSettings.namedExports && wbyPkgExportSettings.namedExports.length > 0) {
                namedExports = `{ ${wbyPkgExportSettings.namedExports.join(", ")} }`;
            }

            let wbyExportTsFilePath = [
                wbyPkg.paths.packageFolder.join("src", wbyPkgExportSettings.exportPath).toString(),
                ".ts"
            ].join("");

            const exportStatement = `export ${namedExports} from "${exportPath}";\n`;

            if (fs.existsSync(wbyExportTsFilePath)) {
                const wbyExportFileContent = fs.readFileSync(wbyExportTsFilePath, "utf-8");
                fs.writeFileSync(wbyExportTsFilePath, `${wbyExportFileContent}${exportStatement}`);
            } else {
                fs.mkdirSync(path.dirname(wbyExportTsFilePath), { recursive: true });
                fs.writeFileSync(wbyExportTsFilePath, exportStatement);
            }

            // 4. Update `exports` in `package.json`.
            const exportEntryKey = `./${path.join(wbyPkgExportSettings.exportPath).replace(/\.js$/, "")}`;

            // @ts-ignore
            wbyPkg.packageJson.exports![exportEntryKey] = `./${path.relative(
                wbyPkg.paths.packageFolder.join("src").toString(),
                wbyExportTsFilePath.replace(".ts", ".js")
            )}`;

            this.ui.debug(
                ` %s → %s`,
                basePkgFilePath,
                path.join(`webiny`, wbyPkgExportSettings.exportPath)
            );
        }
    }

    private copyDirectoryRecursive(source: string, target: string) {
        // Create target directory if it doesn't exist
        if (!fs.existsSync(target)) {
            fs.mkdirSync(target, { recursive: true });
        }

        // Read all files/folders in source directory with file types
        const entries = fs.readdirSync(source, { withFileTypes: true });

        for (const entry of entries) {
            const sourcePath = path.join(source, entry.name);
            const targetPath = path.join(target, entry.name);

            if (entry.isDirectory()) {
                // Recursively copy subdirectories
                this.copyDirectoryRecursive(sourcePath, targetPath);
            } else {
                // Copy file
                fs.copyFileSync(sourcePath, targetPath);
            }
        }
    }
}
