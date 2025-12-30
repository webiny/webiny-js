import { type Abstraction, Metadata } from "@webiny/di";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { type IProjectModel } from "~/abstractions/models/index.js";
import { ProjectError } from "~/ProjectError.js";

export const zodPathToAbstraction = (
    expectedAbstraction: Abstraction<any>,
    project: IProjectModel
) => {
    const getTokenName = (token: symbol) => {
        const str = token.toString();
        return str.replace(/^Symbol\(/, "").replace(/\)$/, "");
    };

    const tokenName = getTokenName(expectedAbstraction.token);

    return z
        .string()
        .describe(`Path to a file exporting ${tokenName}`)
        .superRefine(async (src, ctx) => {
            let absoluteSrcPath = src;
            if (!path.isAbsolute(src)) {
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
            const defName = expectedAbstraction.toString();
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

            return true;
        });
};
