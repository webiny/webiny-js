import { createImplementation } from "@webiny/di";
import {
    Command,
    ListPackagesService,
    MergeExportsService,
    ScanExportsFoldersService,
    UiService
} from "../../abstractions/index.js";
import { GenerateWebinyPkg } from "./GenerateWebinyPkg.js";

export class GenerateWebinyPkgCommand implements Command.Interface<void> {
    constructor(
        private ui: UiService.Interface,
        private listPackagesService: ListPackagesService.Interface,
        private scanExportsFoldersService: ScanExportsFoldersService.Interface,
        private mergeExportsService: MergeExportsService.Interface
    ) {}

    async execute(): Promise<Command.CommandDefinition<void>> {
        return {
            name: "generate-webiny-package",
            description: "Generates `webiny` package",
            params: [],
            options: [],
            handler: async () => {
                const generateWebinyPkg = new GenerateWebinyPkg(
                    this.ui,
                    this.listPackagesService,
                    this.scanExportsFoldersService,
                    this.mergeExportsService
                );
                await generateWebinyPkg.execute();
            }
        };
    }
}

export const generateWebinyPkgCommand = createImplementation({
    abstraction: Command,
    implementation: GenerateWebinyPkgCommand,
    dependencies: [UiService, ListPackagesService, ScanExportsFoldersService, MergeExportsService]
});
