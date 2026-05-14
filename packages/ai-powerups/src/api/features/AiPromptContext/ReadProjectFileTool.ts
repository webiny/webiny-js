import { z } from "zod";
import type { ToolSet } from "ai";
import type { ProjectFileContent } from "./abstractions.js";

const inputSchema = z.object({
    fileId: z.string().describe("The id of the file from the project manifest.")
});

export function createReadProjectFileTool(
    files: ProjectFileContent[],
    excludedFileIds: Set<string>
): ToolSet {
    const fileMap = new Map(files.map(f => [f.id, f]));

    return {
        read_project_file: {
            description:
                "Read the full contents of a project reference file by its id. " +
                "Use this when a file from the manifest contains information relevant to the user's request.",
            inputSchema,
            execute: async (input: unknown) => {
                const { fileId } = input as z.infer<typeof inputSchema>;

                if (excludedFileIds.has(fileId)) {
                    return { error: "File excluded for this generation." };
                }

                const file = fileMap.get(fileId);
                if (!file) {
                    const availableIds = files.map(f => f.id).join(", ");
                    return {
                        error: `File not found. Available ids: ${availableIds}`
                    };
                }

                return {
                    content: file.content,
                    name: file.name
                };
            }
        }
    };
}
