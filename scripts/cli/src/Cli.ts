import { Container } from "@webiny/di";
import { createCliContainer } from "./createCliContainer.js";
import { CliParamsService, RunCliRunnerService } from "./abstractions/index.js";

export class Cli {
    private container: Container;

    private constructor(container: Container) {
        this.container = container;
    }

    run() {
        return this.container.resolve(RunCliRunnerService).execute();
    }

    static async init(params: CliParamsService.Params = {}) {
        const container = await createCliContainer(params);
        return new Cli(container);
    }
}
