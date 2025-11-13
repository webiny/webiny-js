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

                    this.generateExportTsFile(pkgWithExports, webinyPackage);
                }

                this.ui.newLine();
                this.ui.success(`%s package built.`, "webiny");
            }
        };
    }

    private generateExportTsFile(
        pkgWithExports: ListPackagesService.Package,
        webinyPackage: ListPackagesService.Package
    ) {
        const pkgExports = pkgWithExports.packageJson.webiny?.exports!;

        for (const [pkgExport, webinyPkgExport] of Object.entries(pkgExports)) {
            const fullExportPath = path.join(pkgWithExports.name, pkgExport).replace(".ts", ".js");

            const exportPath = webinyPackage.paths.packageFolder
                .join("src", webinyPkgExport)
                .toString();

            // Ensure directory exists
            fs.mkdirSync(path.dirname(exportPath), { recursive: true });

            fs.writeFileSync(exportPath, `export * from "${fullExportPath}";\n`);

            this.ui.debug(` %s → %s`, pkgExport, `webiny/${webinyPkgExport}`);
        }
    }
}

export const buildWebinyPkgCommand = createImplementation({
    abstraction: Command,
    implementation: BuildWebinyPkgCommand,
    dependencies: [UiService, ListPackagesService]
});
