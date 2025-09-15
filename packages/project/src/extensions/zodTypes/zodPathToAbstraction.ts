import { type Abstraction, Metadata } from "@webiny/di-container";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { type IProjectModel } from "~/abstractions/models/index.js";

export const zodPathToAbstraction = (
    expectedAbstraction: Abstraction<any>,
    project: IProjectModel
) => {
    return z
        .string()
        .describe(`Path to a file exporting ${expectedAbstraction.token.toString()}`)
        .superRefine(async (src, ctx) => {
            let absoluteSrcPath = src;
            if (!path.isAbsolute(src)) {
                absoluteSrcPath = project.paths.rootFolder.join(src).toString();
            }

            if (!fs.existsSync(absoluteSrcPath)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Source file does not exist: ${absoluteSrcPath}. Please provide a valid path.`
                });
                return;
            }
            
            //eslint-disable-next-line import/dynamic-import-chunkname
            const { default: exportedImplementation } = await import(absoluteSrcPath);

            if (!exportedImplementation) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Source file for extension "${src}" (type: ${expectedAbstraction.token.toString()}) must export a default implementation.`
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
                    message: `Source file for extension "${src}" (type: ${expectedAbstraction.token.toString()}) must export a class that implements the "${expectedAbstraction.token.toString()}" abstraction.`
                });
            }

            return true;
        });
};
