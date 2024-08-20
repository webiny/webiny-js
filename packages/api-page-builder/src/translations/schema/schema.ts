export const schema = /* GraphQL */ `
    extend type Query {
        translations: TranslationsQuery
    }

    type TranslationsQuery {
        getTranslatedCollection: TranslatedCollectionResponse
        listLanguages: TranslationLanguagesResponse
    }

    extend type Mutation {
        translations: TranslationsMutation
    }

    type TranslationsMutation {
        updateTranslatableCollection: UpdateTranslatableCollectionResponse
    }
`;
