import { type Abstraction, Metadata } from "@webiny/di";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { type IProjectModel } from "~/abstractions/models/index.js";
import { ProjectError } from "~/ProjectError.js";
import { ImplPathResolver } from "~/utils/index.js";

/**
 * TypeScript type for source paths.
 * - `/extensions/${string}` - resolves from project root
 * - `@/${string}` or other tsconfig aliases - resolves using tsconfig.json paths
 * - string (absolute path) - treated as absolute path
 */
export type SrcPath = `/extensions/${string}` | string;

type ZodSrcPathOptions = {
    project: IProjectModel;
    abstraction?: Abstraction<any>;
};

export const zodSrcPath = (options: ZodSrcPathOptions) => {
    const { project, abstraction } = options;

    const getTokenName = (token: symbol) => {
        const str = token.toString();
        return str.replace(/^Symbol\(/, "").replace(/\)$/, "");
    };

    const tokenName = abstraction ? getTokenName(abstraction.token) : undefined;
    const description = abstraction
        ? `Path to a file exporting ${tokenName}. Use "/extensions/..." to resolve from project root, "@/..." for tsconfig path aliases, or provide an absolute path.`
        : `Path: "/extensions/..." resolves from project root, "@/..." resolves using tsconfig path aliases, or provide an absolute path.`;

    return z
        .string()
        .describe(description)
        .transform((val): SrcPath => val as SrcPath)
        .superRefine(async (src, ctx) => {
            // Convert to absolute path for file existence check.
            const absoluteSrcPath = ImplPathResolver.resolvePath(src, project);

            if (!fs.existsSync(absoluteSrcPath)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: ProjectError.formatMessage(
                        `File not found: %s. Please check the path and try again.`,
                        src
                    )
                });
                return;
            }

            // If abstraction validation is required
            if (abstraction) {
                const exportName = path
                    .basename(absoluteSrcPath)
                    .replace(path.extname(absoluteSrcPath), "");

                const exportedImplementation = await ImplPathResolver.importFromPath(src, project);

                if (!exportedImplementation) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: ProjectError.formatMessage(
                            `The file %s must export a class named %s or as a default export.`,
                            src,
                            exportName
                        )
                    });
                    return;
                }

                const metadata = new Metadata(exportedImplementation);
                const metadataName = metadata.getAbstraction().toString();
                const defName = abstraction.toString();
                const isCorrectAbstraction = metadataName === defName;

                if (!isCorrectAbstraction) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: ProjectError.formatMessage(
                            `The class %s in %s must implement the %s interface.`,
                            exportName,
                            src,
                            tokenName || ""
                        )
                    });
                }
            }
        });
};
