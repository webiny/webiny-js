import { createImplementation } from "@webiny/di";
import { Command, UiService } from "../../abstractions/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export type IBuildWebinyPkgCommandParams = any;

interface PackageConfig {
    name: string;
    surface: "api" | "admin";
    path: string;
}

export class BuildWebinyPkgCommand implements Command.Interface<IBuildWebinyPkgCommandParams> {
    constructor(private ui: UiService.Interface) {}

    async execute(): Promise<Command.CommandDefinition<IBuildWebinyPkgCommandParams>> {
        return {
            name: "generate-webiny-package",
            description: "Generates `webiny` package",
            params: [],
            options: [],
            handler: async (params: IBuildWebinyPkgCommandParams) => {
                this.ui.info("Generating `webiny` package...");

                const __dirname = path.dirname(fileURLToPath(import.meta.url));



                const packages: PackageConfig[] = [
                    { name: "@webiny/api-core", surface: "api", path: "../api-core" },
                    {
                        name: "@webiny/api-headless-cms",
                        surface: "api",
                        path: "../api-headless-cms"
                    },
                    { name: "@webiny/admin-core", surface: "admin", path: "../admin-core" },
                    {
                        name: "@webiny/admin-headless-cms",
                        surface: "admin",
                        path: "../admin-headless-cms"
                    }
                ];

                interface FacadeExports {
                    [key: string]:
                        | {
                              types?: string;
                              import?: string;
                              default?: string;
                          }
                        | string;
                }

                function generateFacade() {
                    const facadeExports: FacadeExports = {
                        ".": {
                            types: "./dist/index.d.ts",
                            import: "./dist/index.js",
                            default: "./dist/index.js"
                        }
                    };

                    for (const pkg of packages) {
                        console.log(`Processing ${pkg.name}...`);

                        // Read the internal package's package.json
                        const pkgJsonPath = path.join(__dirname, pkg.path, "package.json");

                        if (!fs.existsSync(pkgJsonPath)) {
                            console.warn(`Warning: ${pkgJsonPath} not found, skipping...`);
                            continue;
                        }

                        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
                        const internalExports = pkgJson.exports || {};

                        // Process each export from the internal package
                        for (const [exportPath, target] of Object.entries(internalExports)) {
                            // Skip root export and wildcards
                            if (
                                exportPath === "." ||
                                exportPath === "./*" ||
                                exportPath.includes("*")
                            ) {
                                continue;
                            }

                            // Remove leading "./" from export path
                            const cleanExportPath = exportPath.replace(/^\.\//, "");

                            // Build the facade export path: ./api/security/apiKeys/CreateApiKey
                            const facadeExportPath = `./${pkg.surface}/${cleanExportPath}`;

                            // Build the source import: @webiny/api-core/security/apiKeys/CreateApiKey
                            const sourceImport = `${pkg.name}/${cleanExportPath}`;

                            // Create the re-export file path in facade package
                            const reExportFilePath = path.join(
                                __dirname,
                                "..",
                                "src",
                                pkg.surface,
                                `${cleanExportPath}.ts`
                            );

                            // Ensure directory exists
                            fs.mkdirSync(path.dirname(reExportFilePath), { recursive: true });

                            // Write the thin re-export file
                            fs.writeFileSync(
                                reExportFilePath,
                                `export * from "${sourceImport}";\n`
                            );

                            console.log(`  ✓ Generated ${facadeExportPath} -> ${sourceImport}`);

                            // Add to facade exports
                            const distPath = `${pkg.surface}/${cleanExportPath}`;
                            facadeExports[facadeExportPath] = {
                                types: `./dist/${distPath}.d.ts`,
                                import: `./dist/${distPath}.js`,
                                default: `./dist/${distPath}.js`
                            };
                        }
                    }

                    // Update the facade package.json
                    const facadePkgJsonPath = path.join(__dirname, "..", "package.json");
                    const facadePkgJson = JSON.parse(fs.readFileSync(facadePkgJsonPath, "utf8"));

                    facadePkgJson.exports = facadeExports;

                    fs.writeFileSync(
                        facadePkgJsonPath,
                        JSON.stringify(facadePkgJson, null, 2) + "\n"
                    );

                    console.log("\n✅ Facade generation complete!");
                    console.log(`Generated ${Object.keys(facadeExports).length - 1} exports`);
                }

                // Run the generator
                generateFacade();
            }
        };
    }
}

export const buildWebinyPkgCommand = createImplementation({
    abstraction: Command,
    implementation: BuildWebinyPkgCommand,
    dependencies: [UiService]
});
