import { createImplementation } from "@webiny/di";
import { GetCliRunnerService, RunCliRunnerService } from "~/abstractions/index.js";
import { hideBin } from "yargs/helpers";
import { Argv } from "yargs";

export class DefaultRunCliRunnerService implements RunCliRunnerService.Interface {
    constructor(private readonly getCliRunnerService: GetCliRunnerService.Interface) {}

    async execute() {
        const cliRunner = (await this.getCliRunnerService.execute()) as Argv;
        // Use process.argv directly since it's the actual argv being used
        return cliRunner.parseAsync(hideBin(process.argv));
    }
}

export const runCliRunnerService = createImplementation({
    abstraction: RunCliRunnerService,
    implementation: DefaultRunCliRunnerService,
    dependencies: [GetCliRunnerService]
});
