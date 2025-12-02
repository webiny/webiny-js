import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IProjectInfoServiceResult {
    webiny: {
        debugEnabled: boolean;
        featureFlags: Record<string, boolean>;
        version: string;
    };
    wcp: {
        projectId: string;
        // user: wcpUser?.email || "N/A",
        usingProjectEnvironmentApiKey: boolean;
    };
    host: {
        os: string;
        nodeJs: string;
        npm: string;
        npx: string;
        yarn: string;
        isCI: boolean;
    };
    pulumi: {
        "@pulumi/pulumi": string;
        "@pulumi/aws": string;
        secretsProvider: string;
        usingPassword: boolean;
    };
}

export interface IProjectInfoService {
    execute(): Promise<IProjectInfoServiceResult>;
}

export const ProjectInfoService = createAbstraction<IProjectInfoService>("ProjectInfoService");

export namespace ProjectInfoService {
    export type Interface = IProjectInfoService;
    export type Result = IProjectInfoServiceResult;
}
