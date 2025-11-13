import { createImplementation } from "@webiny/di";
import { Command, ListPackagesService, UiService } from "../../abstractions/index.js";
import fs from "fs";
import path from "path";

export class BuildWebinyPkgCommand implements Command.Interface<void> {
    constructor(
        private ui: UiService.Interface,
        private listPackagesService: ListPackagesService.Interface
    ) {}

    async execute(): Promise<Command.CommandDefinition<void>> {
        return {
            name: "build-webiny-package",
            description: "Builds `webiny` package",
            params: [],
            options: [],
            handler: async () => {
                this.ui.info("Generating %s package...", "webiny");

                const fullPackagesList = await this.listPackagesService.execute();

                const webinyPackage = fullPackagesList.find(
                    pkg => pkg.packageJson.name === "webiny"
                )!;

                const packagesWithExports = fullPackagesList
                    .filter(pkg => pkg !== webinyPackage)
                    .filter(pkg => Boolean(pkg.packageJson.webiny?.exports));

                // Clean up the src directory.
                const webinySrcPath = webinyPackage.paths.packageFolder.join("src").toString();
                if (fs.existsSync(webinySrcPath)) {
                    fs.rmSync(webinySrcPath, { recursive: true, force: true });
                }

                for (const pkgWithExports of packagesWithExports) {
                    this.ui.newLine();
                    this.ui.info(`%s`, pkgWithExports.name);

                    this.generateExportTsFiles(pkgWithExports, webinyPackage);
                }

                this.ui.newLine();
                this.ui.success(`%s package built.`, "webiny");
            }
        };
    }

    private generateExportTsFiles(
        basePkg: ListPackagesService.Package,
        wbyPkg: ListPackagesService.Package
    ) {
        const pkgExports = basePkg.packageJson.webiny?.exports!;

        for (const [basePkgFilePath, wbyPkgExportPath] of Object.entries(pkgExports)) {
            let wbyExportTsFilePath = wbyPkg.paths.packageFolder
                .join("src", wbyPkgExportPath)
                .toString();

            if (wbyExportTsFilePath.endsWith(".js")) {
                wbyExportTsFilePath = wbyExportTsFilePath.replace(".js", ".ts");
            } else {
                wbyExportTsFilePath = `${wbyExportTsFilePath}.ts`;
            }

            fs.mkdirSync(path.dirname(wbyExportTsFilePath), { recursive: true });

            // Create the export file.
            const exportPath = path.join(basePkg.name, basePkgFilePath).replace(".ts", ".js");

            fs.writeFileSync(wbyExportTsFilePath, `export * from "${exportPath}";\n`);

            this.ui.debug(` %s → %s`, basePkgFilePath, `webiny/${wbyPkgExportPath}`);
        }
    }
}

export const buildWebinyPkgCommand = createImplementation({
    abstraction: Command,
    implementation: BuildWebinyPkgCommand,
    dependencies: [UiService, ListPackagesService]
});
