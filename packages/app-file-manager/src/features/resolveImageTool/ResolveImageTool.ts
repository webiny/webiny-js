import { z } from "zod";
import { Tool } from "@webiny/app-admin/exports/admin.js";
import { GetFileUseCase } from "~/features/getFile/index.js";

const inputSchema = z.object({
    id: z.string().describe("File ID to resolve")
});

const outputSchema = z
    .object({
        id: z.string(),
        name: z.string(),
        size: z.number(),
        mimeType: z.string(),
        src: z.string(),
        width: z.number().optional(),
        height: z.number().optional()
    })
    .nullable();

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

class ResolveImageToolImpl implements Tool.Interface<typeof inputSchema, typeof outputSchema> {
    readonly name = "resolveImage";
    readonly description =
        "Resolves a file manager image by ID. Returns the image metadata including src URL.";
    readonly inputSchema = inputSchema;
    readonly outputSchema = outputSchema;

    constructor(private getFile: GetFileUseCase.Interface) {}

    async execute(input: Input): Promise<Output> {
        const result = await this.getFile.execute({ id: input.id });

        if (!result.success) {
            return null;
        }

        const file = result.file;
        return {
            id: file.id,
            name: file.name,
            mimeType: file.type,
            src: file.src,
            size: file.size,
            width: file.metadata?.image?.width,
            height: file.metadata?.image?.height
        };
    }
}

export const ResolveImageTool = Tool.createImplementation({
    implementation: ResolveImageToolImpl,
    dependencies: [GetFileUseCase]
});
