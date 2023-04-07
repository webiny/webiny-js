import normalizePath from "./normalizePath";
import zod from "zod";

export const createPageValidation = zod.object({
    category: zod.string().max(500)
});

export const createPageCreateValidation = () => {
    return createPageValidation;
};

export const updatePageSettingsValidation = zod
    .object({
        general: zod
            .object({
                tags: zod.array(zod.string().max(50)).max(30, "Cannot store more than 30 tags."),
                snippet: zod.string().max(500),
                layout: zod.string().max(50),
                image: zod
                    .object({
                        id: zod.string(),
                        src: zod.string()
                    })
                    .passthrough()
            })
            .partial(),
        seo: zod.object({
            title: zod.string().max(500).optional().nullish(),
            description: zod.string().max(500).optional().nullish(),
            meta: zod
                .array(
                    zod.object({
                        name: zod.string().max(100),
                        content: zod.string().max(200)
                    })
                )
                .max(30, "Cannot store more than 30 SEO tags.")
                .default([])
        }),
        social: zod.object({
            title: zod.string().max(500).optional().nullish(),
            description: zod.string().max(500).optional().nullish(),
            meta: zod
                .array(
                    zod.object({
                        property: zod.string().max(100),
                        content: zod.string().max(200)
                    })
                )
                .max(30, "Cannot store more than 30 social tags.")
                .default([]),
            image: zod
                .object({
                    id: zod.string(),
                    src: zod.string()
                })
                .passthrough()
                .optional()
                .nullish()
        })
    })
    .passthrough()
    .partial();

export const updatePageValidation = zod
    .object({
        title: zod.string().max(500),
        path: zod
            .string()
            .min(2)
            .max(500)
            .nullish()
            .transform(value => {
                if (!value) {
                    return undefined;
                }
                return normalizePath(value);
            }),
        category: zod.string().max(500),
        /**
         * We need to allow everything through the content object.
         */
        settings: updatePageSettingsValidation,
        content: zod
            .union([zod.object({}).passthrough(), zod.array(zod.object({}).passthrough())])
            .optional()
            .nullish()
    })
    .partial();

export const createPageUpdateValidation = () => {
    return updatePageValidation;
};

export const createPageSettingsUpdateValidation = () => {
    return updatePageSettingsValidation;
};
