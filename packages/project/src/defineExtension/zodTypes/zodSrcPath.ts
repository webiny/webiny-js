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

export const zodSrcPath = (options: ZodSrcPathOptions) => {
    const { project, abstraction } = options;

    const getTokenName = (token: symbol) => {
        const str = token.toString();
        return str.replace(/^Symbol\(/, "").replace(/\)$/, "");
    };

    const tokenName = abstraction ? getTokenName(abstraction.token) : undefined;
    const description = abstraction
        ? `Path to a file exporting ${tokenName}`
        : `Absolute path or relative path from project root (e.g., "extensions/MyFile.ts")`;

    return z
        .string()
        .describe(description)
        .superRefine(async (src, ctx) => {
            // Convert to absolute path for file existence check.
            let absoluteSrcPath: string;
            if (path.isAbsolute(src)) {
                // Already an absolute path.
                absoluteSrcPath = src;
            } else {
                // Relative to project root.
                absoluteSrcPath = project.paths.rootFolder.join(src).toString();
            }

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
                            tokenName || ""
                        )
                    });
                }
            }
        });
};
