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
                revision: productRev1.id,
                latestVersion: false,
                published: true,
                fields: "id",
                v0: productRev1.id
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.de.id,
                revision: productRev1.id,
                latestVersion: false,
                published: true,
                fields: "id",
                v0: productRev1.id
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.en.id,
                revision: productRev1.id,
                latestVersion: false,
                published: true,
                fields: "id",
                v0: productRev1.id
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.it.id,
                revision: productRev2.id,
                latestVersion: true,
                published: false,
                fields: "id",
                v0: productRev2.id
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.de.id,
                revision: productRev2.id,
                latestVersion: true,
                published: false,
                fields: "id",
                v0: productRev2.id
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.en.id,
                revision: productRev2.id,
                latestVersion: true,
                published: false,
                fields: "id",
                v0: productRev2.id
            }
        ],
        thirdRevisionCreated: ({ environmentId, productRev1, productRev3 }) => [
            {
                environment: environmentId,
                model: "product",
                locale: locales.it.id,
                revision: productRev3.id,
                latestVersion: true,
                published: false,
                fields: "id",
                v0: productRev3.id
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.de.id,
                revision: productRev3.id,
                latestVersion: true,
                published: false,
                fields: "id",
                v0: productRev3.id
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.en.id,
                revision: productRev3.id,
                latestVersion: true,
                published: false,
                fields: "id",
                v0: productRev3.id
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.it.id,
                revision: productRev1.id,
                latestVersion: false,
                published: true,
                fields: "id",
                v0: productRev1.id
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.de.id,
                revision: productRev1.id,
                latestVersion: false,
                published: true,
                fields: "id",
                v0: productRev1.id
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.en.id,
                revision: productRev1.id,
                latestVersion: false,
                published: true,
                fields: "id",
                v0: productRev1.id
            }
        ],
        secondRevisionPublished: ({ environmentId, productRev2, productRev3 }) => [
            {
                environment: environmentId,
                model: "product",
                locale: locales.it.id,
                revision: productRev2.id,
                latestVersion: false,
                published: true,
                fields: "id",
                v0: productRev2.id
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.de.id,
                revision: productRev2.id,
                latestVersion: false,
                published: true,
                fields: "id",
                v0: productRev2.id
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.en.id,
                revision: productRev2.id,
                latestVersion: false,
                published: true,
                fields: "id",
                v0: productRev2.id
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.it.id,
                revision: productRev3.id,
                latestVersion: true,
                published: false,
                fields: "id",
                v0: productRev3.id
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.de.id,
                revision: productRev3.id,
                latestVersion: true,
                published: false,
                fields: "id",
                v0: productRev3.id
            },
            {
                environment: environmentId,
                model: "product",
                locale: locales.en.id,
                revision: productRev3.id,
                latestVersion: true,
                published: false,
                fields: "id",
                v0: productRev3.id
            }
        ]
    }
};
