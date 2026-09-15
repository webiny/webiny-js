import { BaseError } from "@webiny/feature/api";

/**
 * A tool declared neither `execute` nor `handler`, so there is nothing to call.
 *
 * Only reachable while both shapes coexist. Once every tool carries a handler, `execute` stops
 * being optional on `IAiSdkTool` and the compiler catches this instead.
 */
export class AiSdkToolNotExecutableError extends BaseError<{ name: string }> {
    override readonly code = "Ai/ToolNotExecutable" as const;

    constructor(name: string) {
        super({
            message: `AI tool "${name}" declares neither "execute" nor "handler".`,
            data: { name }
        });
    }
}
