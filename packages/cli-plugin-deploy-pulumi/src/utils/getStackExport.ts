import type { IUserCommandInput } from "~/types";
import execa from "execa";
import { getProject } from "@webiny/cli/utils";

export type IStackExportResponseDeploymentResource = {
    type: string;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
};

export interface IStackExportResponseDeployment {
    resources: IStackExportResponseDeploymentResource[];
}

export interface IStackExportResponse {
    deployment: IStackExportResponseDeployment;
}

const cache: Record<string, any> = {};

const runPulumiStackExport = ({
    folder,
    env,
    variant,
    cwd
}: Pick<IUserCommandInput, "folder" | "env" | "variant" | "cwd">) => {
    const project = getProject();

    const cacheKey = [folder, env, variant].filter(Boolean).join("_");

    if (cache[cacheKey]) {
        return structuredClone(cache[cacheKey]);
    }

    try {
        const command = ["webiny", "pulumi", folder, "--env", env];
        if (variant) {
            command.push("--variant", variant);
        }

        command.push("--", "stack", "export");

        const { stdout } = execa.sync("yarn", command.filter(Boolean), {
            cwd: cwd || project.root
        });

        const parsed = JSON.parse(stdout);
        if (Object.keys(parsed).length === 0) {
            return null;
        }
        cache[cacheKey] = parsed;
        return structuredClone(cache[cacheKey]);
    } catch {
        return null;
    }
};

export const getStackExport = (
    args: Pick<IUserCommandInput, "folder" | "env" | "variant" | "cwd">
): IStackExportResponse => {
    if (!args.folder) {
        throw new Error(`Please specify a project application folder, for example "apps/admin".`);
    }

    if (!args.env) {
        throw new Error(`Please specify environment, for example "dev".`);
    }

    return runPulumiStackExport(args);
};
