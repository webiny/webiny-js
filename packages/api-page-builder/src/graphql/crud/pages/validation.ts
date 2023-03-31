import normalizePath from "./normalizePath";
import zod from "zod";

export const createPageCreateValidation = () => {
    return zod.object({
        category: zod.string().max(100)
    });
};

export const createPageUpdateValidation = () => {
    return zod
        .object({
            title: zod.string().max(150),
            path: zod
                .string()
                .min(2)
                .max(100)
                .nullish()
                .transform(value => {
                    if (!value) {
                        return undefined;
                    }
                    return normalizePath(value);
                }),
            category: zod.string().max(100),
            /**
             * We need to allow everything through the content object.
             */
            settings: createPageSettingsUpdateValidation(),
            content: zod
                .union([zod.object({}).passthrough(), zod.array(zod.object({}).passthrough())])
                .optional()
                .nullish()
        })
        .partial();
};

export const createPageSettingsUpdateValidation = () => {
    return zod
        .object({
            general: zod
                .object({
                    tags: zod
                        .array(zod.string().max(50))
                        .max(30, "Cannot store more than 30 tags."),
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
        .partial();
};
