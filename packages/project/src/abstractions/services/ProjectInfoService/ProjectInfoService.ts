import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IProjectInfoSection {
    name: string;
    data: Record<string, string>;
}

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
    // Sections a hosting package adds about its own tooling. `webiny about` prints them after the
    // ones above.
    sections: IProjectInfoSection[];
}

export interface IProjectInfoService {
    execute(): Promise<IProjectInfoServiceResult>;
}

export const ProjectInfoService = createAbstraction<IProjectInfoService>("ProjectInfoService");

export namespace ProjectInfoService {
    export type Interface = IProjectInfoService;
    export type Result = IProjectInfoServiceResult;
    export type Section = IProjectInfoSection;
}
