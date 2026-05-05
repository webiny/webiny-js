import {
    ListPackagesService,
    ScanExportsFoldersService,
    UiService
} from "../../abstractions/index.js";
import { computeInputsHash, readMetaFile } from "../GenerateWebinyPkgCommand/WebinyPkgMeta.js";

export class ValidateWebinyPkg {
    constructor(
        private ui: UiService.Interface,
        private listPackagesService: ListPackagesService.Interface,
        private scanExportsFoldersService: ScanExportsFoldersService.Interface
    ) {}

    async execute(): Promise<void> {
        this.ui.info("Validating `webiny` package...");

        const fullPackagesList = await this.listPackagesService.execute();
        const wbyPkg = fullPackagesList.find(pkg => pkg.packageJson.name === "webiny")!;
        const packagesWithoutWebiny = fullPackagesList.filter(pkg => pkg !== wbyPkg);

        const exportFilesMap = this.scanExportsFoldersService.execute(packagesWithoutWebiny);

        const iconsPkg = fullPackagesList.find(pkg => pkg.packageJson.name === "@webiny/icons");
        const iconsSourcePath = iconsPkg
            ? iconsPkg.paths.packageFolder.join("dist").toString()
            : null;
        const srcStaticPath = wbyPkg.paths.packageFolder.join("src-static").toString();

        const currentHash = computeInputsHash({ exportFilesMap, iconsSourcePath, srcStaticPath });
        const storedMeta = readMetaFile(wbyPkg.paths.packageFolder.toString());

        this.ui.newLine();

        if (!storedMeta) {
            this.ui.error(
                "No meta file found in the `webiny` package. Run `yarn webiny-scripts generate-webiny-package` and commit the changes."
            );
            process.exit(1);
        }

        if (currentHash !== storedMeta.inputsHash) {
            this.ui.error(
                "The `webiny` package is out of date. Run `yarn webiny-scripts generate-webiny-package` and commit the changes."
            );
            process.exit(1);
        }

        this.ui.success("The `webiny` package is up to date.");
    }
}
