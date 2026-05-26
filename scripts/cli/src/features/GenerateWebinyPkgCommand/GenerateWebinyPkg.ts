import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
    ListPackagesService,
    MergeExportsService,
    ScanExportsFoldersService,
    UiService
} from "../../abstractions/index.js";
import { computeInputsHash, INPUTS_HASH_FIELD, getAllFiles } from "./WebinyPkgMeta.js";

export interface GenerateResult {
    files: Array<{ relativePath: string; content: string }>;
    exports: Record<string, string>;
    hash: string;
}

export interface GenerateWebinyPkg {
    execute(): Promise<void>;
    computeGenerationResult(): Promise<GenerateResult>;
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

        // Compute expected files and exports
        const result = await this.computeGenerationResult();

        // Write all generated files
        for (const { relativePath, content } of result.files) {
            const fullPath = path.join(webinySrcPath, relativePath);
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, content);
        }

        // Update package.json
        wbyPkg.packageJson.exports = result.exports;
        // @ts-ignore
        wbyPkg.packageJson[INPUTS_HASH_FIELD] = result.hash;

        fs.writeFileSync(
            wbyPkg.paths.packageJsonFile.toString(),
            JSON.stringify(wbyPkg.packageJson, null, 2) + "\n"
        );

        this.ui.newLine();
        this.ui.success(`%s package generated.`, "webiny");
    }

    async computeGenerationResult(): Promise<GenerateResult> {
        const fullPackagesList = await this.listPackagesService.execute();
        const wbyPkg = fullPackagesList.find(pkg => pkg.packageJson.name === "webiny")!;
        const packagesWithoutWebiny = fullPackagesList.filter(pkg => pkg !== wbyPkg);

        const files: GenerateResult["files"] = [];
        const exports: Record<string, string> = {};

        // Static files from src-static (if src-static exists)
        const srcStaticPath = wbyPkg.paths.packageFolder.join("src-static").toString();
        if (fs.existsSync(srcStaticPath)) {
            const staticFiles = getAllFiles(srcStaticPath);
            for (const staticFile of staticFiles) {
                const relativePath = path.relative(srcStaticPath, staticFile);
                files.push({ relativePath, content: fs.readFileSync(staticFile, "utf-8") });
                // Only non-ambient files get an export entry
                if (!staticFile.includes("/ambient/")) {
                    const exportKey = `./${relativePath}`;
                    exports[exportKey] = exportKey;
                }
            }
        }

        // Icons from @webiny/icons source (material design + extras)
        const iconsPkg = fullPackagesList.find(pkg => pkg.packageJson.name === "@webiny/icons");
        if (iconsPkg) {
            // Material design icons
            const materialIconsPkgUrl = await import.meta
                .resolve("@material-design-icons/svg/package.json");
            const materialIconsDir = path.join(
                path.dirname(fileURLToPath(materialIconsPkgUrl)),
                "outlined"
            );
            if (fs.existsSync(materialIconsDir)) {
                const iconFiles = getAllFiles(materialIconsDir);
                for (const iconFile of iconFiles) {
                    const relativePath = path.relative(materialIconsDir, iconFile);
                    files.push({
                        relativePath: path.join("admin", "icons", relativePath),
                        content: fs.readFileSync(iconFile, "utf-8")
                    });
                }
            }

            // Extra icons
            const extraIconsDir = iconsPkg.paths.packageFolder.join("src/extraIcons").toString();
            if (fs.existsSync(extraIconsDir)) {
                const iconFiles = getAllFiles(extraIconsDir);
                for (const iconFile of iconFiles) {
                    const relativePath = path.relative(extraIconsDir, iconFile);
                    files.push({
                        relativePath: path.join("admin", "icons", relativePath),
                        content: fs.readFileSync(iconFile, "utf-8")
                    });
                }
            }

            exports["./admin/icons/*"] = "./admin/icons/*";
        }

        // Merged export files
        const exportFilesMap = this.scanExportsFoldersService.execute(packagesWithoutWebiny);
        for (const [relativePath, exportFiles] of exportFilesMap.entries()) {
            const inputs: MergeExportsService.ExportFileInput[] = [];
            for (const exportFile of exportFiles) {
                inputs.push({
                    packageName: exportFile.packageName,
                    fileContent: fs.readFileSync(exportFile.absolutePath, "utf-8"),
                    filePath: exportFile.absolutePath
                });
            }

            const mergedContent = this.mergeExportsService.execute(inputs);
            files.push({ relativePath, content: mergedContent });

            const exportKey = `./${relativePath.replace(/\.ts$/, "")}`;
            const exportValue = `./${relativePath.replace(/\.ts$/, ".js")}`;
            exports[exportKey] = exportValue;
        }

        // Compute hash from inputs
        const iconsSrcPath = iconsPkg ? iconsPkg.paths.packageFolder.join("src").toString() : null;
        const hash = computeInputsHash({ exportFilesMap, iconsSrcPath, srcStaticPath });

        return { files, exports, hash };
    }
}
