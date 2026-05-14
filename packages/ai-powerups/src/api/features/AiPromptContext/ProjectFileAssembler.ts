import { GetFileContentsByIdUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import { GetFileUseCase } from "@webiny/api-file-manager/features/file/GetFile/index.js";
import {
    ProjectFileAssembler as Abstraction,
    ProjectFileCache,
    type ProjectFileContent
} from "./abstractions.js";

const SUPPORTED_MIME_PREFIXES = ["text/"];
const SUPPORTED_MIME_TYPES = new Set(["application/json", "application/csv"]);

function isSupportedType(mimeType: string): boolean {
    if (SUPPORTED_MIME_PREFIXES.some(prefix => mimeType.startsWith(prefix))) {
        return true;
    }
    return SUPPORTED_MIME_TYPES.has(mimeType);
}

function estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
}

class ProjectFileAssemblerImpl implements Abstraction.Interface {
    constructor(
        private getFileContents: GetFileContentsByIdUseCase.Interface,
        private getFile: GetFileUseCase.Interface,
        private cache: ProjectFileCache.Interface
    ) {}

    async execute(
        projectId: string,
        version: number,
        files: Array<{ id: string; name: string; mimeType: string }>,
        warnings: string[]
    ): Promise<{ files: ProjectFileContent[]; cacheHit: boolean }> {
        const cached = await this.cache.get(projectId, version);
        if (cached.hit) {
            return { files: cached.files, cacheHit: true };
        }

        const assembled = await this.assembleFiles(files, warnings);
        await this.cache.set(projectId, version, assembled);
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
                    console.warn("ProjectFileAssembler:", msg);
                    warnings.push(msg);
                    return null;
                }

                const content = contentsResult.value.buffer.toString("utf-8");

                let description: string | undefined;
                if (damResult.isFail()) {
                    console.warn(
                        `ProjectFileAssembler: failed to load DAM record for "${file.name}" (${file.id})`
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

export const ProjectFileAssembler = Abstraction.createImplementation({
    implementation: ProjectFileAssemblerImpl,
    dependencies: [GetFileContentsByIdUseCase, GetFileUseCase, ProjectFileCache]
});
