import { createAbstraction } from "@webiny/feature/api";

// ============================================================================
// ProjectFileCache
// ============================================================================

export interface IProjectFileCache {
    get(projectId: string, version: number): Promise<{ files: ProjectFileContent[]; hit: boolean }>;
    set(projectId: string, version: number, files: ProjectFileContent[]): Promise<void>;
}

export const ProjectFileCache = createAbstraction<IProjectFileCache>("ProjectFileCache");

export namespace ProjectFileCache {
    export type Interface = IProjectFileCache;
}

// ============================================================================
// ProjectFileAssembler
// ============================================================================

export interface IProjectFileAssembler {
    execute(
        projectId: string,
        version: number,
        files: Array<{ id: string; name: string; mimeType: string }>,
        warnings: string[]
    ): Promise<{ files: ProjectFileContent[]; cacheHit: boolean }>;
}

export const ProjectFileAssembler =
    createAbstraction<IProjectFileAssembler>("ProjectFileAssembler");

export namespace ProjectFileAssembler {
    export type Interface = IProjectFileAssembler;
}

// ============================================================================
// AiPromptContext
// ============================================================================

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
    cacheHit: boolean;
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
