import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import { GetFileContentsByIdUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import { GetFileUseCase } from "@webiny/api-file-manager/features/file/GetFile/index.js";
import { TextExtractor } from "@webiny/api-core/features/ai/index.js";
import {
    AiPromptContextBuilder as Abstraction,
    ProjectFileAssembler,
    type AiPromptContext,
    type AiPromptContextParams,
    type ProjectFileContent,
    type ResolvedPersona,
    type ResolvedProject
} from "./abstractions.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";
import type { ProjectPreset } from "~/api/features/Projects/types.js";
import { WriterPersonaSection } from "./WriterPersonaSection.js";
import { ReaderPersonaSection } from "./ReaderPersonaSection.js";
import { ProjectSection } from "./ProjectSection.js";

function resolvePersonas(
    settings: IAiPowerUpsSettings,
    project: ProjectPreset | undefined,
    params: AiPromptContextParams
): { reader?: ResolvedPersona; writer?: ResolvedPersona } {
    const readerPersonaId = params.readerPersonaId ?? project?.defaultReaderPersonaId ?? undefined;
    const writerPersonaId = params.writerPersonaId ?? project?.defaultWriterPersonaId ?? undefined;

    const readerPreset = readerPersonaId
        ? settings.readerPersonas?.presets?.find(p => p.id === readerPersonaId)
        : undefined;

    const writerPreset = writerPersonaId
        ? settings.writerPersonas?.presets?.find(p => p.id === writerPersonaId)
        : undefined;

    return {
        reader: readerPreset
            ? {
                  name: readerPreset.name,
                  description: readerPreset.description,
                  style: readerPreset.style
              }
            : undefined,
        writer: writerPreset
            ? {
                  name: writerPreset.name,
                  description: writerPreset.description,
                  style: writerPreset.style
              }
            : undefined
    };
}

function formatContext(ctx: AiPromptContext): string {
    const sections: string[] = [];

    if (ctx.writerPersona) {
        sections.push(WriterPersonaSection.format(ctx.writerPersona));
    }
    if (ctx.readerPersona) {
        sections.push(ReaderPersonaSection.format(ctx.readerPersona));
    }
    if (ctx.project) {
        const projectText = ProjectSection.format(ctx.project);
        if (projectText) {
            sections.push(projectText);
        }
    }

    return sections.length > 0 ? "\n\n" + sections.join("\n\n") : "";
}

function emptyContext(warnings: string[]): AiPromptContext {
    return {
        project: undefined,
        readerPersona: undefined,
        writerPersona: undefined,
        allProjectFiles: [],
        excludedFileIds: new Set(),
        cacheHit: false,
        warnings,
        toString() {
            return "";
        }
    };
}

class AiPromptContextBuilderImpl implements Abstraction.Interface {
    constructor(
        private getSettings: GetSettingsUseCase.Interface,
        private fileAssembler: ProjectFileAssembler.Interface,
        private getFileContents: GetFileContentsByIdUseCase.Interface,
        private getFile: GetFileUseCase.Interface,
        private textExtractor: TextExtractor.Interface
    ) {}

    async execute(params: AiPromptContextParams): Promise<AiPromptContext> {
        const warnings: string[] = [];

        const settingsResult = await this.getSettings.execute();
        if (settingsResult.isFail()) {
            warnings.push("Failed to load AI PowerUps settings.");
            return emptyContext(warnings);
        }

        const settings = settingsResult.value;
        const projectPreset = params.projectId
            ? settings.projects?.presets?.find(p => p.id === params.projectId)
            : undefined;

        const { reader, writer } = resolvePersonas(settings, projectPreset, params);
        const excludedFileIds = new Set(params.excludedFileIds ?? []);

        let project: ResolvedProject | undefined;
        let allProjectFiles: ProjectFileContent[] = [];
        let cacheHit = false;

        if (projectPreset) {
            const assembled = await this.fileAssembler.execute(
                projectPreset.id,
                projectPreset.version ?? 0,
                projectPreset.files ?? [],
                warnings
            );
            allProjectFiles = assembled.files;
            cacheHit = assembled.cacheHit;

            const visibleFiles =
                excludedFileIds.size > 0
                    ? allProjectFiles.filter(f => !excludedFileIds.has(f.id))
                    : allProjectFiles;

            project = {
                name: projectPreset.name,
                instructions: projectPreset.instructions,
                files: visibleFiles,
                totalTokens: visibleFiles.reduce((sum, f) => sum + f.tokenCount, 0)
            };
        }

        const additionalFiles = await this.fetchAdditionalFiles(params.additionalFileIds, warnings);
        if (additionalFiles.length > 0) {
            allProjectFiles = [...allProjectFiles, ...additionalFiles];
        }

        const ctx: AiPromptContext = {
            project,
            readerPersona: reader,
            writerPersona: writer,
            allProjectFiles,
            excludedFileIds,
            cacheHit,
            warnings,
            toString() {
                return formatContext(this);
            }
        };

        return ctx;
    }

    private async fetchAdditionalFiles(
        fileIds: string[] | null | undefined,
        warnings: string[]
    ): Promise<ProjectFileContent[]> {
        if (!fileIds || fileIds.length === 0) {
            return [];
        }

        const results = await Promise.all(
            fileIds.map(async (fileId): Promise<ProjectFileContent | null> => {
                const [contentsResult, damResult] = await Promise.all([
                    this.getFileContents.execute(fileId),
                    this.getFile.execute(fileId)
                ]);

                if (contentsResult.isFail()) {
                    warnings.push(
                        `Failed to load additional file (${fileId}): ${contentsResult.error.message}`
                    );
                    return null;
                }

                const name = damResult.isOk() ? damResult.value.name : fileId;
                const mimeType = damResult.isOk()
                    ? damResult.value.type
                    : "application/octet-stream";

                if (!this.textExtractor.canExtract(mimeType)) {
                    warnings.push(
                        `Skipped additional file "${name}" (${fileId}): unsupported type "${mimeType}".`
                    );
                    return null;
                }

                const { text: content } = await this.textExtractor.extract(
                    contentsResult.value.buffer,
                    mimeType
                );

                return {
                    id: fileId,
                    name,
                    content,
                    description: damResult.isOk() ? damResult.value.description : undefined,
                    tokenCount: Math.ceil(content.length / 4)
                };
            })
        );

        return results.filter((r): r is ProjectFileContent => r !== null);
    }
}

export const AiPromptContextBuilder = Abstraction.createImplementation({
    implementation: AiPromptContextBuilderImpl,
    dependencies: [
        GetSettingsUseCase,
        ProjectFileAssembler,
        GetFileContentsByIdUseCase,
        GetFileUseCase,
        TextExtractor
    ]
});
