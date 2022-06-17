import { Pulumi, Options } from "@webiny/pulumi-sdk";

export function getStackOutput<TStackOutput = Record<string, unknown>>(
    folder: string,
    env: string,
    map?: Record<string, string>
): TStackOutput;

export function getStackOutput<TStackOutput = Record<string, unknown>>(options: {
    folder: string;
    env: string;
    // variant?: string; TODO: finish staged deployments.
    map?: Record<string, string>;
    cwd?: string;
}): TStackOutput;

interface GetPulumiParams {
    projectApplication?: Record<string, unknown>;
    pulumi?: Options
    install?: boolean;
}

export function getPulumi(params: GetPulumiParams): Pulumi;
