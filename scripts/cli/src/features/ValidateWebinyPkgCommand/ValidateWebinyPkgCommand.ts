import { createImplementation } from "@webiny/di";
import {
    Command,
    ListPackagesService,
    MergeExportsService,
    ScanExportsFoldersService,
    UiService
} from "../../abstractions/index.js";
import { ValidateWebinyPkg } from "./ValidateWebinyPkg.js";

export class ValidateWebinyPkgCommand implements Command.Interface<void> {
    constructor(
        private ui: UiService.Interface,
        private listPackagesService: ListPackagesService.Interface,
        private scanExportsFoldersService: ScanExportsFoldersService.Interface,
        private mergeExportsService: MergeExportsService.Interface
    ) {}

    async execute(): Promise<Command.CommandDefinition<void>> {
        return {
            name: "validate-webiny-package",
            description: "Validates that the `webiny` package is up to date",
            params: [],
            options: [],
            handler: async () => {
                const validator = new ValidateWebinyPkg(
                    this.ui,
                    this.listPackagesService,
                    this.scanExportsFoldersService,
                    this.mergeExportsService
                );
                await validator.execute();
            }
        };
    }
}

export const validateWebinyPkgCommand = createImplementation({
    abstraction: Command,
    implementation: ValidateWebinyPkgCommand,
    dependencies: [UiService, ListPackagesService, ScanExportsFoldersService, MergeExportsService]
});
