export {
    CliContext as Context,
    ProjectApplication,
    IProjectApplicationPackage,
    Project,
    NonEmptyArray
} from "@webiny/cli/types";

import type { Pulumi } from "@webiny/pulumi-sdk";

export type IPulumi = Pulumi;

export interface IUserCommandInput {
    env: string;
    folder: string;
    region: string | undefined;
    variant: string | undefined;
    allowLocalStateFiles?: boolean;
    debug?: boolean;
    cwd?: string;
    telemetry?: boolean;
    logs?: boolean;
    json?: boolean;
    file?: string;
    build?: boolean;
    deploy?: boolean;
    package?: string;
    preview?: boolean;
    inspect?: boolean;
    depth?: number;
    function?: string | string[];
    allowProduction?: boolean;
    increaseTimeout?: number;
    increaseHandshakeTimeout?: number;
    deploymentLogs?: boolean;
    _: (string | boolean | number)[];
}
