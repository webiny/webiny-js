import fs from "fs";
import path from "path";
import type { PackageJson } from "type-fest";
import {
    ListPackagesService,
    MergeExportsService,
    ScanExportsFoldersService,
    UiService
} from "../../abstractions/index.js";
import { computeInputsHash, INPUTS_HASH_FIELD } from "./WebinyPkgMeta.js";

const ambientDeclaration = (file: string) => !file.includes("/ambient/");

export interface GenerateWebinyPkg {
    execute(): Promise<void>;
}

export class GenerateWebinyPkg implements GenerateWebinyPkg {
    constructor(
        private ui: UiService.Interface,
        private listPackagesService: ListPackagesService.Interface,
        private scanExportsFoldersService: ScanExportsFoldersService.Interface,
        private mergeExportsService: MergeExportsService.Interface
    ) {}

    async execute(): Promise<void> {
        this.ui.info("Generating %s package...", "webiny");

        const fullPackagesList = await this.listPackagesService.execute();

        const wbyPkg = fullPackagesList.find(pkg => pkg.packageJson.name === "webiny")!;

        // Reset exports in `webiny` package.json
        wbyPkg.packageJson.exports = {};

        // Clean up the src directory.
        const webinySrcPath = wbyPkg.paths.packageFolder.join("src").toString();
        if (fs.existsSync(webinySrcPath)) {
            fs.rmSync(webinySrcPath, { recursive: true, force: true });
        }

        // Copy static files from src-static to src (if src-static exists).
        const srcStaticPath = wbyPkg.paths.packageFolder.join("src-static").toString();
        if (fs.existsSync(srcStaticPath)) {
            this.copyDirectoryRecursive(srcStaticPath, webinySrcPath);
            this.generateExportsForStaticFiles(srcStaticPath, wbyPkg);
        }

        // Copy icons from packages/icons/dist to packages/webiny/src/admin/icons
        const iconsPkg = fullPackagesList.find(pkg => pkg.packageJson.name === "@webiny/icons");
        const iconsSourcePath = iconsPkg
            ? iconsPkg.paths.packageFolder.join("dist").toString()
            : null;
        if (iconsPkg) {
            this.copyIconsToWebinyPackage(iconsPkg, wbyPkg);
        }

        // Scan for exports folders in all packages
        const packagesWithoutWebiny = fullPackagesList.filter(pkg => pkg !== wbyPkg);
        const exportFilesMap = this.scanExportsFoldersService.execute(packagesWithoutWebiny);

        // Process each unique file path
        for (const [relativePath, exportFiles] of exportFilesMap.entries()) {
            this.ui.newLine();
            this.ui.info(`Processing %s from %s package(s)`, relativePath, exportFiles.length);

            // Read file contents from all packages
            const inputs: MergeExportsService.ExportFileInput[] = [];
            for (const exportFile of exportFiles) {
                const fileContent = fs.readFileSync(exportFile.absolutePath, "utf-8");
                inputs.push({
                    packageName: exportFile.packageName,
                    fileContent,
                    filePath: exportFile.absolutePath
                });

                this.ui.debug(` From %s`, exportFile.packageName);
            }

            // Merge exports
            const mergedContent = this.mergeExportsService.execute(inputs);

            // Write merged file to webiny package
            const wbyExportTsFilePath = path.join(webinySrcPath, relativePath);
            fs.mkdirSync(path.dirname(wbyExportTsFilePath), { recursive: true });
            fs.writeFileSync(wbyExportTsFilePath, mergedContent);

            // Update package.json exports
            const exportKey = `./${relativePath.replace(/\.ts$/, "")}`;
            const exportValue = `./${relativePath.replace(/\.ts$/, ".js")}`;

            // @ts-ignore
            wbyPkg.packageJson.exports![exportKey] = exportValue;

            this.ui.debug(` Generated: %s`, exportKey);
        }

        const iconsSrcPath = iconsPkg ? iconsPkg.paths.packageFolder.join("src").toString() : null;

        // @ts-ignore
        wbyPkg.packageJson[INPUTS_HASH_FIELD] = computeInputsHash({
            exportFilesMap,
            iconsSrcPath,
            srcStaticPath
        });

        fs.writeFileSync(
            wbyPkg.paths.packageJsonFile.toString(),
            JSON.stringify(wbyPkg.packageJson, null, 2) + "\n"
        );

        this.ui.newLine();
        this.ui.success(`%s package generated.`, "webiny");
    }

    private generateExportsForStaticFiles(
        srcStaticPath: string,
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

    private copyDirectoryRecursive(
        source: string,
        target: string,
        filter?: (name: string) => boolean
    ) {
        // Create target directory if it doesn't exist
        if (!fs.existsSync(target)) {
            fs.mkdirSync(target, { recursive: true });
        }

        // Read all files/folders in source directory with file types
        const entries = fs.readdirSync(source, { withFileTypes: true });

        for (const entry of entries) {
            // Apply filter if provided
            if (filter && !filter(entry.name)) {
                continue;
            }

            const sourcePath = path.join(source, entry.name);
            const targetPath = path.join(target, entry.name);

            if (entry.isDirectory()) {
                // Recursively copy subdirectories
                this.copyDirectoryRecursive(sourcePath, targetPath, filter);
            } else {
                // Copy file
                fs.copyFileSync(sourcePath, targetPath);
            }
        }
    }

    private copyIconsToWebinyPackage(
        iconsPkg: ListPackagesService.Package,
        wbyPkg: ListPackagesService.Package
    ) {
        const iconsSourcePath = iconsPkg.paths.packageFolder.join("dist").toString();
        const iconsTargetPath = wbyPkg.paths.packageFolder.join("src", "admin", "icons").toString();

        if (!fs.existsSync(iconsSourcePath)) {
            this.ui.warning("Icons source path not found: %s", iconsSourcePath);
            return;
        }

        this.ui.info("Copying icons from %s to %s", iconsSourcePath, iconsTargetPath);
        this.copyDirectoryRecursive(
            iconsSourcePath,
            iconsTargetPath,
            name => !name.endsWith("package.json")
        );

        // Generate exports for icon files
        const key = `./admin/icons/*`;
        if (wbyPkg.packageJson.exports) {
            (wbyPkg.packageJson.exports as PackageJson.ExportConditions)[key] = key;
        }
    }
}
