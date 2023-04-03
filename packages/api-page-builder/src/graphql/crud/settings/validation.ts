import zod from "zod";
import trimEnd from "lodash/trimEnd";
import { parseIdentifier } from "@webiny/utils";

// We don't want trailing slashes in Page Builder app's important URLs (website URL, website preview URL, app URL).
const trimTrailingSlashes = (value: string): string => trimEnd(value, "/");

export const createSettingsCreateValidation = () => {
    return zod.object({
        name: zod.string().max(500).optional(),
        websiteUrl: zod
            .string()
            .url()
            .max(500)
            .transform(value => {
                if (!value) {
                    return value;
                }
                return trimTrailingSlashes(value);
            })
            .optional(),
        websitePreviewUrl: zod
            .string()
            .url()
            .max(500)
            .optional()
            .transform(value => {
                if (!value) {
                    return value;
                }
                return trimTrailingSlashes(value);
            }),
        favicon: zod
            .object({
                id: zod.string().optional(),
                src: zod.string().optional()
            })
            .passthrough()
            .optional(),
        logo: zod
            .object({
                id: zod.string().optional(),
                src: zod.string().optional()
            })
            .passthrough()
            .optional(),
        social: zod
            .object({
                facebook: zod.string().url().max(500).optional(),
                twitter: zod.string().url().max(500).optional(),
                instagram: zod.string().url().max(500).optional(),
                image: zod
                    .object({
                        id: zod.string().optional(),
                        src: zod.string().optional()
                    })
                    .passthrough()
                    .optional()
            })
            .passthrough()
            .default({})
            .optional(),
        htmlTags: zod
            .object({
                header: zod.string().optional(),
                footer: zod.string().optional()
            })
            .passthrough()
            .optional(),
        pages: zod
            .object({
                home: zod
                    .string()
                    .nullable()
                    .optional()
                    .transform(value => {
                        if (!value) {
                            return value;
                        }
                        const { id } = parseIdentifier(value);
                        return id;
                    }),
                notFound: zod
                    .string()
                    .nullable()
                    .optional()
                    .transform(value => {
                        if (!value) {
                            return value;
                        }
                        const { id } = parseIdentifier(value);
                        return id;
                    })
            })
            .passthrough()
            .optional()
    });
};
