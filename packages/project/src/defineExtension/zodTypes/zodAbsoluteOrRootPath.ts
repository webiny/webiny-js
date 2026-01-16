import { z } from "zod";
import path from "path";
import fs from "fs";
import { type IProjectModel } from "~/abstractions/models/index.js";
import { ProjectError } from "~/ProjectError.js";

/**
 * Validates that a path is either:
 * 1. An absolute path (e.g., starts with "/" on Unix or a drive letter on Windows)
 * 2. A path starting with "/" (from project root)
 *
 * Rejects all relative paths:
 * - "./file.ts" or "../folder/file.ts" (explicitly relative)
 * - "folder/file.ts" (implicitly relative)
 */
export const zodAbsoluteOrRootPath = (project: IProjectModel) => {
    return z
        .string()
        .describe(`Absolute path or path starting from project root (e.g., "/extensions/MyFile.ts")`)
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
            }
        });
};
