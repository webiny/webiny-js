import {
    ListPackagesService,
    ScanExportsFoldersService,
    UiService
} from "../../abstractions/index.js";
import { computeInputsHash, INPUTS_HASH_FIELD } from "../GenerateWebinyPkgCommand/WebinyPkgMeta.js";

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
        const iconsSrcPath = iconsPkg ? iconsPkg.paths.packageFolder.join("src").toString() : null;
        const srcStaticPath = wbyPkg.paths.packageFolder.join("src-static").toString();

        const currentHash = computeInputsHash({ exportFilesMap, iconsSrcPath, srcStaticPath });
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
            process.exit(1);
        }

        this.ui.success("The `webiny` package is up to date.");
    }
}
