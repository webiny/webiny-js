import { createImplementation } from "@webiny/di";
import { ArgvParserService, GlobalOptionsRegistryService } from "~/abstractions/index.js";
import yargs from "yargs";

export class DefaultArgvParserService implements ArgvParserService.Interface {
    constructor(
        private readonly globalOptionsRegistryService: GlobalOptionsRegistryService.Interface
    ) {}

    parse<T = Record<string, any>>(argv: string[]): T {
        const yargsInstance = yargs(argv).help(false).version(false);

        // Register global options dynamically.
        // Note: All global options are expected to be synchronous for argv parsing.
        const globalOptions = this.globalOptionsRegistryService.execute();
        for (const globalOption of globalOptions) {
            const result = globalOption.execute();
            // Global options should be synchronous for immediate argv parsing
            const { name, config } = result as Awaited<typeof result>;
            yargsInstance.option(name, {
                type: config.type,
                default: config.default,
                desc: config.description,
                alias: config.alias,
                choices: config.choices
            });
        }

        const parsed = yargsInstance.parseSync();

        // Yargs automatically converts kebab-case to camelCase, so we can use the parsed result directly
        return parsed as unknown as T;
    }
}

export const argvParserService = createImplementation({
    abstraction: ArgvParserService,
    implementation: DefaultArgvParserService,
    dependencies: [GlobalOptionsRegistryService]
});
