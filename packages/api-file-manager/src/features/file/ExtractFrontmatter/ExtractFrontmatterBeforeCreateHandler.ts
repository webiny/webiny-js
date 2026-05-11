import frontmatter from "front-matter";
import { FileBeforeCreateEventHandler } from "~/features/file/CreateFile/events.js";
import { GetFileContentsByKeyUseCase } from "~/features/file/GetFileContentsByKey/index.js";

function isMarkdownFile(name: string): boolean {
    return name.endsWith(".md") || name.endsWith(".mdx");
}

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
            const parsed = frontmatter<{ description?: string }>(content);
            if (parsed.attributes.description) {
                file.description = parsed.attributes.description;
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
