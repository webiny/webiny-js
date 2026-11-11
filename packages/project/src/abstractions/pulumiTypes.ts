import { type Readable, type Writable } from "node:stream";

/*
 * The part of `@webiny/pulumi-sdk` the deploy abstractions use. They are declared here rather than
 * imported, so `@webiny/project` doesn't depend on the Pulumi SDK and standalone projects don't
 * install it. `@webiny/project-aws` implements `GetPulumiService` with the SDK's `Pulumi` class,
 * which has to stay assignable to `Pulumi` below, so the compiler catches the two drifting apart.
 */

export interface PulumiProcessResult {
    readonly stdout: string;
    readonly stderr: string;
    readonly exitCode: number;
}

export interface PulumiProcess extends Promise<PulumiProcessResult> {
    readonly stdin: Writable | null;
    readonly stdout: Readable | null;
    readonly stderr: Readable | null;
}

export interface PulumiArgs {
    [key: string]: string | boolean | undefined | string[];
}

export interface PulumiExecaArgs {
    env?: {
        [key: string]: string | undefined;
    };

    [key: string]: any;
}

export interface PulumiOptions {
    args?: PulumiArgs;
    execa?: PulumiExecaArgs;
    beforePulumiInstall?: () => any;
    afterPulumiInstall?: () => any;
    pulumiFolder?: string;
}

export interface PulumiRunArgs {
    command: string | string[];
    args?: PulumiArgs;
    execa?: PulumiExecaArgs;
    beforePulumiInstall?: () => any;
    afterPulumiInstall?: () => any;
}

export interface Pulumi {
    run(args: PulumiRunArgs): PulumiProcess;
}
