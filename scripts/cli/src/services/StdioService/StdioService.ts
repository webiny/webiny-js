import { createImplementation } from "@webiny/di";
import { StdioService } from "../../abstractions/index.js";

export class DefaultStdioService implements StdioService.Interface {
    getStdout() {
        return process.stdout;
    }

    getStderr() {
        return process.stderr;
    }

    getStdin() {
        return process.stdin;
    }
}

export const stdioService = createImplementation({
    abstraction: StdioService,
    implementation: DefaultStdioService,
    dependencies: []
});
