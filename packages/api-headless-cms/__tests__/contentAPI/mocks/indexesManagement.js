import { locales } from "./I18NLocales";

export default {
    CmsContentEntrySearch: {
        initialProductCreated: ({ environmentId, productId }) => [
            {
                environment: environmentId,
                model: "product",
                locale: locales.it.id,
                revision: productId,
                latestVersion: true,
                published: false,
                fields: "id",
                v0: productId
            },
            {
                environment: environmentId,
                fields: "title",
                latestVersion: true,
                locale: locales.de.id,
                model: "product",
                published: false,
                revision: productId,
                v0: "Kugelschreiber"
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.de.id,
                revision: productId,
                latestVersion: true,
                published: false,
                fields: "id",
                v0: productId
            },
            {
                environment: environmentId,
                fields: "title",
                latestVersion: true,
                locale: locales.en.id,
                model: "product",
                published: false,
                revision: productId,
                v0: "Pen"
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.en.id,
                revision: productId,
                latestVersion: true,
                published: false,
                fields: "id",
                v0: productId
            }
        ],
        initialProductPublished: ({ environmentId, productId }) => [
            {
                environment: environmentId,
                model: "product",
                locale: locales.it.id,
                revision: productId,
                latestVersion: true,
                published: true,
                fields: "id",
                v0: productId
            },
            {
                environment: environmentId,
                fields: "title",
                latestVersion: true,
                locale: locales.de.id,
                model: "product",
                published: true,
                revision: productId,
                v0: "Kugelschreiber"
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.de.id,
                revision: productId,
                latestVersion: true,
                published: true,
                fields: "id",
                v0: productId
            },
            {
                environment: environmentId,
                fields: "title",
                latestVersion: true,
                locale: locales.en.id,
                model: "product",
                published: true,
                revision: productId,
                v0: "Pen"
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.en.id,
                revision: productId,
                latestVersion: true,
                published: true,
                fields: "id",
                v0: productId
            }
        ],
        secondRevisionCreated: ({ environmentId, productRev1, productRev2 }) => [
            {
                environment: environmentId,
                model: "product",
                locale: locales.it.id,
                revision: productRev1,
                latestVersion: false,
                published: true,
                fields: "id",
                v0: productRev1
            },
            {
                environment: environmentId,
                fields: "title",
                latestVersion: false,
                locale: locales.de.id,
                model: "product",
                published: true,
                revision: productRev1,
                v0: "Kugelschreiber"
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.de.id,
                revision: productRev1,
                latestVersion: false,
                published: true,
                fields: "id",
                v0: productRev1
            },
            {
                environment: environmentId,
                fields: "title",
                latestVersion: false,
                locale: locales.en.id,
                model: "product",
                published: true,
                revision: productRev1,
                v0: "Pen"
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.en.id,
                revision: productRev1,
                latestVersion: false,
                published: true,
                fields: "id",
                v0: productRev1
            },
            {
                environment: environmentId,
                fields: "id",
                latestVersion: true,
                locale: locales.it.id,
                model: "product",
                published: false,
                revision: productRev2,
                v0: productRev2
            },
            {
                environment: environmentId,
                fields: "title",
                latestVersion: true,
                locale: locales.de.id,
                model: "product",
                published: false,
                revision: productRev2,
                v0: "Kugelschreiber 2"
            },
            {
                environment: environmentId,
                fields: "id",
                latestVersion: true,
                locale: locales.de.id,
                model: "product",
                published: false,
                revision: productRev2,
                v0: productRev2
            },
            {
                environment: environmentId,
                fields: "title",
                latestVersion: true,
                locale: locales.en.id,
                model: "product",
                published: false,
                revision: productRev2,
                v0: "Pen 2"
            },
            {
                environment: environmentId,
                fields: "id",
                latestVersion: true,
                locale: locales.en.id,
                model: "product",
                published: false,
                revision: productRev2,
                v0: productRev2
            }
        ],
        thirdRevisionCreated: ({ environmentId, productRev1, productRev3 }) => [
            {
                environment: environmentId,
                fields: "id",
                latestVersion: true,
                locale: locales.it.id,
                model: "product",
                published: false,
                revision: productRev3,
                v0: productRev3
            },
            {
                environment: environmentId,
                fields: "title",
                latestVersion: true,
                locale: locales.de.id,
                model: "product",
                published: false,
                revision: productRev3,
                v0: "Kugelschreiber 3"
            },
            {
                environment: environmentId,
                fields: "id",
                latestVersion: true,
                locale: locales.de.id,
                model: "product",
                published: false,
                revision: productRev3,
                v0: productRev3
            },
            {
                environment: environmentId,
                fields: "title",
                latestVersion: true,
                locale: locales.en.id,
                model: "product",
                published: false,
                revision: productRev3,
                v0: "Pen 3"
            },
            {
                environment: environmentId,
                fields: "id",
                latestVersion: true,
                locale: locales.en.id,
                model: "product",
                published: false,
                revision: productRev3,
                v0: productRev3
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.it.id,
                revision: productRev1,
                latestVersion: false,
                published: true,
                fields: "id",
                v0: productRev1
            },
            {
                environment: environmentId,
                fields: "title",
                latestVersion: false,
                locale: locales.de.id,
                model: "product",
                published: true,
                revision: productRev1,
                v0: "Kugelschreiber"
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.de.id,
                revision: productRev1,
                latestVersion: false,
                published: true,
                fields: "id",
                v0: productRev1
            },
            {
                environment: environmentId,
                fields: "title",
                latestVersion: false,
                locale: locales.en.id,
                model: "product",
                published: true,
                revision: productRev1,
                v0: "Pen"
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.en.id,
                revision: productRev1,
                latestVersion: false,
                published: true,
                fields: "id",
                v0: productRev1
            }
        ],
        secondRevisionPublished: ({ environmentId, productRev2, productRev3 }) => [
            {
                environment: environmentId,
                fields: "id",
                latestVersion: false,
                locale: locales.it.id,
                model: "product",
                published: true,
                revision: productRev2,
                v0: productRev2
            },
            {
                environment: environmentId,
                fields: "title",
                latestVersion: false,
                locale: locales.de.id,
                model: "product",
                published: true,
                revision: productRev2,
                v0: "Kugelschreiber 2"
            },
            {
                environment: environmentId,
                fields: "id",
                latestVersion: false,
                locale: locales.de.id,
                model: "product",
                published: true,
                revision: productRev2,
                v0: productRev2
            },
            {
                environment: environmentId,
                fields: "title",
                latestVersion: false,
                locale: locales.en.id,
                model: "product",
                published: true,
                revision: productRev2,
                v0: "Pen 2"
            },
            {
                environment: environmentId,
                fields: "id",
                latestVersion: false,
                locale: locales.en.id,
                model: "product",
                published: true,
                revision: productRev2,
                v0: productRev2
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.it.id,
                revision: productRev3,
                latestVersion: true,
                published: false,
                fields: "id",
                v0: productRev3
            },
            {
                environment: environmentId,
                fields: "title",
                latestVersion: true,
                locale: locales.de.id,
                model: "product",
                published: false,
                revision: productRev3,
                v0: "Kugelschreiber 3"
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.de.id,
                revision: productRev3,
                latestVersion: true,
                published: false,
                fields: "id",
                v0: productRev3
            },
            {
                environment: environmentId,
                fields: "title",
                latestVersion: true,
                locale: locales.en.id,
                model: "product",
                published: false,
                revision: productRev3,
                v0: "Pen 3"
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.en.id,
                revision: productRev3,
                latestVersion: true,
                published: false,
                fields: "id",
                v0: productRev3
            }
        ]
    }
};
