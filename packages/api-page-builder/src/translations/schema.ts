export const schema = /* GraphQL */ `
    extend type Query {
        translations: TranslationsQuery
    }

    type Language {
        id: ID!
        name: String!
        code: String!
        direction: String!
        isBaseLanguage: Boolean!
    }

    type TranslationLanguagesResponse {
        data: [Language!]
        error: CmsError
    }

    type TranslationsQuery {
        #getTranslatedCollection: TranslatedCollectionResponse
        listLanguages: TranslationLanguagesResponse
    }

    extend type Mutation {
        translations: TranslationsMutation
    }

    type UpdateTranslatableCollectionResponse {
        data: Boolean
        error: CmsError
    }

    input TranslatableItem {
        itemId: String!
        value: String!
    }

    type TranslationsMutation {
        updateTranslatableCollection(
            collectionId: ID!
            items: [TranslatableItem!]!
        ): UpdateTranslatableCollectionResponse
    }
`;
