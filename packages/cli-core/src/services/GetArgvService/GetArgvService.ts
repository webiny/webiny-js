import { createImplementation } from "@webiny/di";
import { ArgvParserService, GetArgvService, type ParsedArgv } from "~/abstractions/index.js";

export class DefaultGetArgvService implements GetArgvService.Interface {
    constructor(private readonly argvParserService: ArgvParserService.Interface) {}

    execute<T = Record<string, any>>(): ParsedArgv<T> {
        return this.argvParserService.parse<T>(process.argv.slice(2));
    }
}

export const getArgvService = createImplementation({
    abstraction: GetArgvService,
    implementation: DefaultGetArgvService,
    dependencies: [ArgvParserService]
});

