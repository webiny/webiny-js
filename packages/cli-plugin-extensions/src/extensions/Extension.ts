import { AbstractExtension, ExtensionTypeConstructorParams } from "./AbstractExtension";
import { AdminExtension } from "./AdminExtension";
import { ApiExtension } from "./ApiExtension";
import { PbElementExtension } from "./PbElementExtension";
import { WorkspaceExtension } from "./WorkspaceExtension";
import loadJson from "load-json-file";
import { PackageJson } from "@webiny/cli-plugin-scaffold/types";
import path from "path";
import { WebsiteExtension } from "~/extensions/WebsiteExtension";

type PackageJsonPath = string;

export class Extension extends AbstractExtension {
    extension: AbstractExtension;

    constructor(params: ExtensionTypeConstructorParams) {
        super(params);

        switch (params.type) {
            case "admin": {
                this.extension = new AdminExtension(params);
                break;
            }
            case "api": {
                this.extension = new ApiExtension(params);
                break;
            }
            case "pbElement": {
                this.extension = new PbElementExtension(params);
                break;
            }
            case "website": {
                this.extension = new WebsiteExtension(params);
                break;
            }
            case "workspace": {
                this.extension = new WorkspaceExtension(params);
                break;
            }
            default: {
                throw new Error(`Unknown extension type: ${params.type}`);
            }
        }
    }

    async link() {
        await this.extension.link();
    }

    getNextSteps(): string[] {
        return this.extension.getNextSteps();
    }

    static async fromPackageJsonPath(pkgJsonPath: PackageJsonPath) {
        const loadedPkgJson = await loadJson<PackageJson>(pkgJsonPath);

        const extensionType = await Extension.getDownloadedExtensionType(loadedPkgJson);
        if (!extensionType) {
            return null;
        }

        return new Extension({
            name: path.basename(path.dirname(pkgJsonPath)),
            type: extensionType,
            location: path.dirname(pkgJsonPath),
            packageName: loadedPkgJson.name
        });
    }

    static async getDownloadedExtensionType(pkgJson: PackageJsonPath | PackageJson) {
        const loadedPkgJson =
            typeof pkgJson === "string" ? await loadJson<PackageJson>(pkgJson) : pkgJson;

        const keywords = loadedPkgJson.keywords;
        // If there is no keywords, we consider the folder to be a workspace.
        if (!Array.isArray(keywords)) {
            return "workspace";
        }

        for (const keyword of keywords) {
            if (keyword.startsWith("webiny-extension-type:")) {
                return keyword.replace("webiny-extension-type:", "");
            }
        }

        throw new Error(`Could not determine the extension type from the downloaded extension.`);
    }
}
