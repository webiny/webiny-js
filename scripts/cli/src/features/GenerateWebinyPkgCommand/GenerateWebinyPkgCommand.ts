import { createImplementation } from "@webiny/di";
import { Command, ListPackagesService, UiService } from "../../abstractions/index.js";
import fs from "fs";
import path from "path";

export class GenerateWebinyPkgCommand implements Command.Interface<void> {
    constructor(
        private ui: UiService.Interface,
        private listPackagesService: ListPackagesService.Interface
    ) {}

    async execute(): Promise<Command.CommandDefinition<void>> {
        return {
            name: "generate-webiny-package",
            description: "Generates `webiny` package",
            params: [],
            options: [],
            handler: async () => {
                this.ui.info("Generating %s package...", "webiny");

                const fullPackagesList = await this.listPackagesService.execute();

                const wbyPkg = fullPackagesList.find(pkg => pkg.packageJson.name === "webiny")!;

                // Reset exports in `webiny` package.json
                const wbyPkgJsonPath = wbyPkg.paths.packageJsonFile.toString();
                const webinyPkgJson = JSON.parse(fs.readFileSync(wbyPkgJsonPath, "utf-8"));

                webinyPkgJson.exports = {};

                fs.writeFileSync(wbyPkgJsonPath, JSON.stringify(webinyPkgJson, null, 2) + "\n");

                const packagesWithExports = fullPackagesList
                    .filter(pkg => pkg !== wbyPkg)
                    .filter(pkg => Boolean(pkg.packageJson.webiny?.exports));

                // Clean up the src directory.
                const webinySrcPath = wbyPkg.paths.packageFolder.join("src").toString();
                if (fs.existsSync(webinySrcPath)) {
                    fs.rmSync(webinySrcPath, { recursive: true, force: true });
                }

                for (const pkgWithExports of packagesWithExports) {
                    this.ui.newLine();
                    this.ui.info(`%s`, pkgWithExports.name);

                    this.generateExportsForPkg(pkgWithExports, wbyPkg);
                }

                this.ui.newLine();
                this.ui.success(`%s package generated.`, "webiny");
            }
        };
    }

    private generateExportsForPkg(
        pkgWithExports: ListPackagesService.Package,
        wbyPkg: ListPackagesService.Package
    ) {
        const wbyPkgJsonPath = wbyPkg.paths.packageJsonFile.toString();
        const webinyPkgJson = JSON.parse(fs.readFileSync(wbyPkgJsonPath, "utf-8"));

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

            // 3. ss
            let wbyExportTsFilePath = wbyPkg.paths.packageFolder
                .join("src", wbyPkgExportSettings.exportPath)
                .toString();

            if (wbyExportTsFilePath.endsWith(".js")) {
                wbyExportTsFilePath = wbyExportTsFilePath.replace(".js", ".ts");
            } else {
                wbyExportTsFilePath = path.join(wbyExportTsFilePath, "index.ts");
            }

            // 4. Create the directory if it doesn't exist.
            fs.mkdirSync(path.dirname(wbyExportTsFilePath), { recursive: true });

            // 5. Create the export TS file.
            const exportPath = path
                .join(pkgWithExports.name, basePkgFilePath)
                .replace(".tsx", ".js")
                .replace(".ts", ".js");

            let namedExports = "*";
            if (wbyPkgExportSettings.namedExports && wbyPkgExportSettings.namedExports.length > 0) {
                namedExports = `{ ${wbyPkgExportSettings.namedExports.join(", ")} }`;
            }

            fs.writeFileSync(wbyExportTsFilePath, `export ${namedExports} from "${exportPath}";\n`);

            // 6. Update `exports` in `package.json`.
            if (!webinyPkgJson.exports) {
                webinyPkgJson.exports = {};
            }

            const exportEntryKey = `./${path.join(wbyPkgExportSettings.exportPath).replace(/\.js$/, "")}`;
            webinyPkgJson.exports[exportEntryKey] = `./${path.relative(
                wbyPkg.paths.packageFolder.join("src").toString(),
                wbyExportTsFilePath.replace(".ts", ".js")
            )}`;

            console.log(webinyPkgJson.exports);

            this.ui.debug(
                ` %s → %s`,
                basePkgFilePath,
                path.join(`webiny`, wbyPkgExportSettings.exportPath)
            );
        }

        // 7. Write back the updated `package.json`.
        fs.writeFileSync(wbyPkgJsonPath, JSON.stringify(webinyPkgJson, null, 2) + "\n");
    }
}

export const generateWebinyPkgCommand = createImplementation({
    abstraction: Command,
    implementation: GenerateWebinyPkgCommand,
    dependencies: [UiService, ListPackagesService]
});
