import fs from "fs";
import path from "path";
import {
    ListPackagesService,
    MergeExportsService,
    ScanExportsFoldersService,
    UiService
} from "../../abstractions/index.js";
import {
    collectInputEntries,
    computeInputsHash,
    getAllFiles,
    INPUTS_HASH_FIELD
} from "../GenerateWebinyPkgCommand/WebinyPkgMeta.js";
import { GenerateWebinyPkg } from "../GenerateWebinyPkgCommand/GenerateWebinyPkg.js";

export class ValidateWebinyPkg {
    constructor(
        private ui: UiService.Interface,
        private listPackagesService: ListPackagesService.Interface,
        private scanExportsFoldersService: ScanExportsFoldersService.Interface,
        private mergeExportsService: MergeExportsService.Interface
    ) {}

    async execute(): Promise<void> {
        this.ui.info("Validating `webiny` package...");

        const fullPackagesList = await this.listPackagesService.execute();
        const wbyPkg = fullPackagesList.find(pkg => pkg.packageJson.name === "webiny")!;
        const packagesWithoutWebiny = fullPackagesList.filter(pkg => pkg !== wbyPkg);

        // Quick hash check
        const exportFilesMap = this.scanExportsFoldersService.execute(packagesWithoutWebiny);
        const iconsPkg = fullPackagesList.find(pkg => pkg.packageJson.name === "@webiny/icons");
        const iconsSrcPath = iconsPkg ? iconsPkg.paths.packageFolder.join("src").toString() : null;
        const srcStaticPath = wbyPkg.paths.packageFolder.join("src-static").toString();
        const params = { exportFilesMap, iconsSrcPath, srcStaticPath };
        const currentHash = computeInputsHash(params);
        // @ts-ignore
        const storedHash = wbyPkg.packageJson[INPUTS_HASH_FIELD] as string | undefined;

        this.ui.newLine();

        if (!storedHash) {
            this.ui.error(
                "No inputs hash found in the `webiny` package.json. Run `yarn webiny-scripts generate-webiny-package` and commit the changes."
            );
            process.exit(1);
        }

        if (currentHash !== storedHash) {
            this.ui.error(
                "The `webiny` package is out of date. Run `yarn webiny-scripts generate-webiny-package` and commit the changes."
            );
            this.ui.newLine();
            this.ui.warning(
                "Note: if things look fine locally, this may be caused by a recent merge of the base branch into your PR — new or modified export files from those commits are not yet reflected in the generated `webiny` package."
            );
            this.ui.newLine();
            this.ui.info("Stored hash:   %s", storedHash);
            this.ui.info("Computed hash: %s", currentHash);
            this.ui.newLine();
            this.ui.info(
                "Files included in computed hash (%s):",
                collectInputEntries(params).length.toString()
            );
            for (const { key } of collectInputEntries(params)) {
                this.ui.info("  %s", key);
            }
            process.exit(1);
        }

        // Deep check: compute expected state and compare against current src/
        const webinySrcPath = wbyPkg.paths.packageFolder.join("src").toString();
        const generator = new GenerateWebinyPkg(
            this.ui,
            this.listPackagesService,
            this.scanExportsFoldersService,
            this.mergeExportsService
        );
        const expected = await generator.computeGenerationResult();

        const expectedPaths = new Set(expected.files.map(f => f.relativePath));

        const issues: string[] = [];

        // Check for expected files that don't exist
        for (const relPath of expectedPaths) {
            const fullPath = path.join(webinySrcPath, relPath);
            if (!fs.existsSync(fullPath)) {
                issues.push(relPath);
            }
        }

        // Check for extra files on disk that aren't expected
        if (fs.existsSync(webinySrcPath)) {
            const actualPaths = getAllFiles(webinySrcPath);
            for (const actualPath of actualPaths) {
                const relPath = path.relative(webinySrcPath, actualPath);
                if (!expectedPaths.has(relPath)) {
                    issues.push(relPath);
                }
            }
        }

        if (issues.length > 0) {
            this.ui.error("The `webiny` package has file mismatch(es):");
            for (const issue of issues) {
                this.ui.error("  %s", issue);
            }
            this.ui.newLine();
            this.ui.error(
                "Run `yarn webiny-scripts generate-webiny-package` and commit the changes."
            );
            process.exit(1);
        }

        // Also check exports match
        // @ts-ignore
        const currentExports = JSON.stringify(wbyPkg.packageJson.exports);
        const expectedExports = JSON.stringify(expected.exports);
        if (currentExports !== expectedExports) {
            this.ui.error("The `webiny` package `exports` field is out of date.");
            this.ui.error(
                "Run `yarn webiny-scripts generate-webiny-package` and commit the changes."
            );
            process.exit(1);
        }

        this.ui.success("The `webiny` package is up to date.");
    }
}
