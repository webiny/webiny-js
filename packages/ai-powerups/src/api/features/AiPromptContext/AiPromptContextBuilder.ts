import { compress, decompress } from "@webiny/utils/features/compression/legacy/gzip.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { GetFileContentsByIdUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import { GetFileUseCase } from "@webiny/api-file-manager/features/file/GetFile/index.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import {
    AiPromptContextBuilder as Abstraction,
    type AiPromptContext,
    type AiPromptContextParams,
    type ProjectFileContent,
    type ResolvedPersona,
    type ResolvedProject
} from "./abstractions.js";
import { WriterPersonaSection } from "./WriterPersonaSection.js";
import { ReaderPersonaSection } from "./ReaderPersonaSection.js";
import { ProjectSection } from "./ProjectSection.js";

const SUPPORTED_MIME_PREFIXES = ["text/"];
const SUPPORTED_MIME_TYPES = new Set(["application/json", "application/csv"]);
const CACHE_TTL_DAYS = 30;

function isSupportedType(mimeType: string): boolean {
    if (SUPPORTED_MIME_PREFIXES.some(prefix => mimeType.startsWith(prefix))) {
        return true;
    }
    return SUPPORTED_MIME_TYPES.has(mimeType);
}

interface CachedProjectContext {
    files: ProjectFileContent[];
}

function estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
}

class AiPromptContextBuilderImpl implements Abstraction.Interface {
    constructor(
        private getSettings: GetSettingsUseCase.Interface,
        private getFileContents: GetFileContentsByIdUseCase.Interface,
        private getFile: GetFileUseCase.Interface,
        private keyValueStore: GlobalKeyValueStore.Interface
    ) {}

    async execute(params: AiPromptContextParams): Promise<AiPromptContext> {
        const warnings: string[] = [];

        const settingsResult = await this.getSettings.execute();
        if (settingsResult.isFail()) {
            warnings.push("Failed to load AI PowerUps settings.");
            return this.buildContext(
                undefined,
                undefined,
                undefined,
                [],
                new Set(),
                false,
                warnings
            );
        }

        const settings = settingsResult.value;

        const project = params.projectId
            ? settings.projects?.presets?.find(p => p.id === params.projectId)
            : undefined;

        const readerPersonaId =
            params.readerPersonaId ?? project?.defaultReaderPersonaId ?? undefined;
        const writerPersonaId =
            params.writerPersonaId ?? project?.defaultWriterPersonaId ?? undefined;

        const readerPersona = readerPersonaId
            ? settings.readerPersonas?.presets?.find(p => p.id === readerPersonaId)
            : undefined;

        const writerPersona = writerPersonaId
            ? settings.writerPersonas?.presets?.find(p => p.id === writerPersonaId)
            : undefined;

        let resolvedProject: ResolvedProject | undefined;
        let allProjectFiles: ProjectFileContent[] = [];
        let cacheHit = false;
        const excludedFileIds = new Set(params.excludedFileIds ?? []);

        if (project) {
            const assembled = await this.getOrAssembleFiles(
                project.id,
                project.version ?? 0,
                project.files ?? [],
                warnings
            );
            allProjectFiles = assembled.files;
            cacheHit = assembled.cacheHit;

            const visibleFiles =
                excludedFileIds.size > 0
                    ? allProjectFiles.filter(f => !excludedFileIds.has(f.id))
                    : allProjectFiles;

            resolvedProject = {
                name: project.name,
                instructions: project.instructions,
                files: visibleFiles,
                totalTokens: visibleFiles.reduce((sum, f) => sum + f.tokenCount, 0)
            };
        }

        const resolvedReader: ResolvedPersona | undefined = readerPersona
            ? {
                  name: readerPersona.name,
                  description: readerPersona.description,
                  style: readerPersona.style
              }
            : undefined;

        const resolvedWriter: ResolvedPersona | undefined = writerPersona
            ? {
                  name: writerPersona.name,
                  description: writerPersona.description,
                  style: writerPersona.style
              }
            : undefined;

        return this.buildContext(
            resolvedProject,
            resolvedReader,
            resolvedWriter,
            allProjectFiles,
            excludedFileIds,
            cacheHit,
            warnings
        );
    }

    private buildContext(
        project: ResolvedProject | undefined,
        readerPersona: ResolvedPersona | undefined,
        writerPersona: ResolvedPersona | undefined,
        allProjectFiles: ProjectFileContent[],
        excludedFileIds: Set<string>,
        cacheHit: boolean,
        warnings: string[]
    ): AiPromptContext {
        return {
            project,
            readerPersona,
            writerPersona,
            allProjectFiles,
            excludedFileIds,
            cacheHit,
            warnings,
            toString() {
                const sections: string[] = [];

                if (writerPersona) {
                    sections.push(WriterPersonaSection.format(writerPersona));
                }
                if (readerPersona) {
                    sections.push(ReaderPersonaSection.format(readerPersona));
                }
                if (project) {
                    const projectText = ProjectSection.format(project);
                    if (projectText) {
                        sections.push(projectText);
                    }
                }

                return sections.length > 0 ? "\n\n" + sections.join("\n\n") : "";
            }
        };
    }

    private async getOrAssembleFiles(
        projectId: string,
        version: number,
        files: Array<{ id: string; name: string; mimeType: string }>,
        warnings: string[]
    ): Promise<{ files: ProjectFileContent[]; cacheHit: boolean }> {
        const key = `AiProjectContext/${projectId}/v${version}`;

        const cached = await this.keyValueStore.get<string>(key);
        if (!cached.isFail() && cached.value) {
            try {
                const decompressed = await decompress(Buffer.from(cached.value, "base64"));
                const parsed = JSON.parse(decompressed.toString("utf-8")) as CachedProjectContext;
                return { files: parsed.files, cacheHit: true };
            } catch (error) {
                console.warn("AiPromptContextBuilder: cache entry corrupted, rebuilding", {
                    key,
                    error
                });
            }
        }

        const assembled = await this.assembleFiles(files, warnings);

        try {
            const payload: CachedProjectContext = { files: assembled };
            const compressed = await compress(JSON.stringify(payload));
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);
            await this.keyValueStore.set(key, compressed.toString("base64"), { expiresAt });
        } catch (error) {
            console.warn("AiPromptContextBuilder: cache write failed", { key, error });
        }

        return { files: assembled, cacheHit: false };
    }

    private async assembleFiles(
        files: Array<{ id: string; name: string; mimeType: string }>,
        warnings: string[]
    ): Promise<ProjectFileContent[]> {
        const supportedFiles = files.filter(f => isSupportedType(f.mimeType));

        if (supportedFiles.length === 0) {
            return [];
        }

        const results = await Promise.all(
            supportedFiles.map(async (file): Promise<ProjectFileContent | null> => {
                const [contentsResult, damResult] = await Promise.all([
                    this.getFileContents.execute(file.id),
                    this.getFile.execute(file.id)
                ]);

                if (contentsResult.isFail()) {
                    const msg = `Failed to load file "${file.name}" (${file.id}): ${contentsResult.error.message}`;
                    console.warn("AiPromptContextBuilder:", msg);
                    warnings.push(msg);
                    return null;
                }

                const content = contentsResult.value.buffer.toString("utf-8");

                let description: string | undefined;
                if (damResult.isFail()) {
                    console.warn(
                        `AiPromptContextBuilder: failed to load DAM record for "${file.name}" (${file.id})`
                    );
                } else if (damResult.value.description) {
                    description = damResult.value.description;
                }

                return {
                    id: file.id,
                    name: file.name,
                    content,
                    description,
                    tokenCount: estimateTokenCount(content)
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
        GetFileContentsByIdUseCase,
        GetFileUseCase,
        GlobalKeyValueStore
    ]
});
