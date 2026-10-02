import { FileBeforeCreateEventHandler } from "@webiny/api-file-manager/features/file/CreateFile/events.js";
import { GetFileContentsByKeyUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsByKey/index.js";

function isMarkdownFile(name: string): boolean {
    return name.endsWith(".md") || name.endsWith(".mdx");
}

type Frontmatter = { description?: string; title?: string; tags?: string[] };

class ExtractFrontmatterBeforeCreateHandlerImpl implements FileBeforeCreateEventHandler.Interface {
    constructor(private getFileContentsByKey: GetFileContentsByKeyUseCase.Interface) {}

    async handle(event: FileBeforeCreateEventHandler.Event): Promise<void> {
        const { file } = event.payload;

        if (!isMarkdownFile(file.name)) {
            return;
        }

        if (file.description) {
            return;
        }

        const result = await this.getFileContentsByKey.execute(file.key);
        if (result.isFail()) {
            return;
        }

        const content = result.value.buffer.toString("utf-8");

        try {
            // Loaded on first use, so front-matter and js-yaml aren't part of every cold start.
            const { default: frontmatter } = await import("front-matter");
            const parsed = frontmatter<Frontmatter>(content);
            // Description takes precedence over title.
            if (parsed.attributes.description) {
                file.description = parsed.attributes.description;
            } else if (parsed.attributes.title) {
                file.description = parsed.attributes.title;
            }

            if (parsed.attributes.tags) {
                file.tags = parsed.attributes.tags;
            }
        } catch {
            // Malformed frontmatter — skip silently.
        }
    }
}

export const ExtractFrontmatterBeforeCreateHandler =
    FileBeforeCreateEventHandler.createImplementation({
        implementation: ExtractFrontmatterBeforeCreateHandlerImpl,
        dependencies: [GetFileContentsByKeyUseCase]
    });
