import zod from "zod";
import trimEnd from "lodash/trimEnd";
import { parseIdentifier } from "@webiny/utils";

// We don't want trailing slashes in Page Builder app's important URLs (website URL, website preview URL, app URL).
const trimTrailingSlashes = (value: string): string => trimEnd(value, "/");

export const createSettingsCreateValidation = () => {
    return zod
        .object({
            name: zod.string().max(500).optional(),
            websiteUrl: zod
                .union([zod.string().max(500).url(), zod.string().nullish().optional()])
                .nullish()
                .optional()
                .transform(value => {
                    if (!value) {
                        return value || "";
                    }
                    return trimTrailingSlashes(value);
                })
                .optional(),
            websitePreviewUrl: zod
                .union([zod.string().max(500).url(), zod.string().nullish().optional()])
                .nullish()
                .optional()
                .transform(value => {
                    if (!value) {
                        return value || "";
                    }
                    return trimTrailingSlashes(value);
                }),
            favicon: zod
                .object({
                    id: zod
                        .string()
                        .nullish()
                        .optional()
                        .transform(value => value || undefined),
                    src: zod
                        .string()
                        .nullish()
                        .optional()
                        .transform(value => value || undefined)
                })
                .passthrough()
                .nullish()
                .optional()
                .transform(value => {
                    return value || undefined;
                }),
            logo: zod
                .object({
                    id: zod
                        .string()
                        .nullish()
                        .optional()
                        .transform(value => value || undefined),
                    src: zod
                        .string()
                        .nullish()
                        .optional()
                        .transform(value => value || undefined)
                })
                .passthrough()
                .nullish()
                .optional()
                .transform(value => value || undefined),
            social: zod
                .object({
                    facebook: zod
                        .string()
                        .url()
                        .max(500)
                        .nullish()
                        .optional()
                        .transform(value => value || undefined),
                    twitter: zod
                        .string()
                        .url()
                        .max(500)
                        .nullish()
                        .optional()
                        .transform(value => value || undefined),
                    instagram: zod
                        .string()
                        .url()
                        .max(500)
                        .nullish()
                        .optional()
                        .transform(value => value || undefined),
                    linkedIn: zod
                        .string()
                        .url()
                        .max(500)
                        .nullish()
                        .optional()
                        .transform(value => value || undefined),
                    image: zod
                        .object({
                            id: zod.string().optional(),
                            src: zod.string().optional()
                        })
                        .passthrough()
                        .nullish()
                        .optional()
                        .transform(value => value || undefined)
                })
                .passthrough()
                .nullish()
                .default({})
                .optional()
                .transform(value => value || undefined),
            htmlTags: zod
                .object({
                    header: zod
                        .string()
                        .nullish()
                        .optional()
                        .transform(value => value || undefined),
                    footer: zod
                        .string()
                        .nullish()
                        .optional()
                        .transform(value => value || undefined)
                })
                .passthrough()
                .nullish()
                .optional()
                .transform(value => value || undefined),
            pages: zod
                .object({
                    home: zod
                        .string()
                        .nullish()
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
                        .nullish()
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
                .nullish()
                .optional()
                .transform(value => value || undefined)
        })
        .partial()
        .passthrough();
};
