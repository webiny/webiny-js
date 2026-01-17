import { type Abstraction, Metadata } from "@webiny/di";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { type IProjectModel } from "~/abstractions/models/index.js";
import { ProjectError } from "~/ProjectError.js";

type ZodSrcPathOptions = {
    project: IProjectModel;
    abstraction?: Abstraction<any>;
};

/**
 * Unified validator for src paths.
 * 
 * Validates that a path is either:
 * 1. An absolute path (e.g., starts with "/" on Unix or a drive letter on Windows)
 * 2. A path starting with "/" (from project root)
 *
 * Rejects all relative paths:
 * - Explicitly relative: `./file.ts`, `../folder/file.ts`
 * - Implicitly relative: `folder/file.ts`
 * 
 * If abstraction is provided, also validates that the file exports the correct abstraction.
 */
export const zodSrcPath = (options: ZodSrcPathOptions) => {
    const { project, abstraction } = options;

    const getTokenName = (token: symbol) => {
        const str = token.toString();
        return str.replace(/^Symbol\(/, "").replace(/\)$/, "");
    };

    const tokenName = abstraction ? getTokenName(abstraction.token) : undefined;
    const description = abstraction
        ? `Path to a file exporting ${tokenName}`
        : `Absolute path or path starting from project root (e.g., "/extensions/MyFile.ts")`;

    return z
        .string()
        .describe(description)
        .superRefine(async (src, ctx) => {
            // First, check for explicitly relative paths (starts with ./ or ../)
            // This provides a more specific error message
            if (src.startsWith("./") || src.startsWith("../")) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: ProjectError.formatMessage(
                        `Relative paths are not supported. Path %s must be either an absolute path or start with "/" to reference from project root (e.g., "/extensions/MyFile.ts").`,
                        src
                    )
                });
                return;
            }

            // Then, check if path is either absolute or starts with "/"
            // This catches all other relative paths (e.g., "folder/file.ts")
            if (!src.startsWith("/") && !path.isAbsolute(src)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: ProjectError.formatMessage(
                        `Path %s must be either an absolute path or start with "/" to reference from project root (e.g., "/extensions/MyFile.ts").`,
                        src
                    )
                });
                return;
            }

            // Convert to absolute path for file existence check
            let absoluteSrcPath = src;
            if (src.startsWith("/")) {
                // For paths starting with "/", they're relative to project root
                // Remove the leading "/" before joining with rootFolder
                absoluteSrcPath = project.paths.rootFolder.join(src.slice(1)).toString();
            }
            // Otherwise, src is already an absolute path

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

                const importedModule = await import(absoluteSrcPath);
                const exportedImplementation = importedModule?.[exportName];
                if (!exportedImplementation) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: ProjectError.formatMessage(
                            `The file %s must export a class named %s.`,
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
                            tokenName
                        )
                    });
                }
            }
        });
};
