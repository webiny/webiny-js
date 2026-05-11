import { createAbstraction } from "@webiny/feature/api";

export interface AiPromptContextParams {
    projectId?: string | null;
    readerPersonaId?: string | null;
    writerPersonaId?: string | null;
    excludedFileIds?: string[] | null;
}

export interface ProjectFileContent {
    id: string;
    name: string;
    content: string;
    description?: string;
    tokenCount: number;
}

export interface ResolvedProject {
    name: string;
    instructions?: string;
    files: ProjectFileContent[];
    totalTokens: number;
}

export interface ResolvedPersona {
    name: string;
    description: string;
    style?: string;
}

export interface AiPromptContext {
    project?: ResolvedProject;
    readerPersona?: ResolvedPersona;
    writerPersona?: ResolvedPersona;
    allProjectFiles: ProjectFileContent[];
    excludedFileIds: Set<string>;
    warnings: string[];
    toString(): string;
}

export interface IAiPromptContextBuilder {
    execute(params: AiPromptContextParams): Promise<AiPromptContext>;
}

export const AiPromptContextBuilder = createAbstraction<IAiPromptContextBuilder>(
    "AiPowerUpsPromptContextBuilder"
);

export namespace AiPromptContextBuilder {
    export type Interface = IAiPromptContextBuilder;
    export type Params = AiPromptContextParams;
    export type Context = AiPromptContext;
}
