import lodashMerge from "lodash/merge";
import { createGraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { PbContext } from "~/graphql/types";
import { translatableCollectionResolvers } from "~/translations/translatableCollection/graphql/resolvers";
import { translatableCollectionSchema } from "~/translations/translatableCollection/graphql/schema";
import { translatedCollectionSchema } from "~/translations/translatedCollection/graphql/schema";
import { translatedCollectionResolvers } from "~/translations/translatedCollection/graphql/resolvers";
import { createCmsModelPlugin } from "@webiny/api-headless-cms";
import { translatableCollectionModel } from "~/translations/translatableCollection/repository/translatableCollection.model";
import { translatedCollectionModel } from "~/translations/translatedCollection/repository/translatedCollection.model";

const baseSchema = /* GraphQL */ `
    type TranslationsQuery {
        _empty: String
    }

    type TranslationsMutation {
        _empty: String
    }

    extend type Query {
        translations: TranslationsQuery
    }

    extend type Mutation {
        translations: TranslationsMutation
    }
`;

const baseResolvers = {
    Query: {
        translations: () => ({})
    },
    Mutation: {
        translations: () => ({})
    }
};

export const createTranslations = () => {
    return [
        createCmsModelPlugin(translatableCollectionModel, { validateLayout: false }),
        createCmsModelPlugin(translatedCollectionModel, { validateLayout: false })
    ];
};

export const createTranslationsGraphQl = () => {
    return [
        createGraphQLSchemaPlugin<PbContext>({
            typeDefs: `${baseSchema} ${translatableCollectionSchema} ${translatedCollectionSchema}`,
            resolvers: lodashMerge(
                baseResolvers,
                translatableCollectionResolvers,
                translatedCollectionResolvers
            )
        })
    ];
};
