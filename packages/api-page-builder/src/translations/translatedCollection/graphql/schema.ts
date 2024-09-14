export const translatedCollectionSchema = /* GraphQL*/ `
    type TranslatedItem {
        itemId: String!
        baseValue: String!
        baseValueModifiedOn: String!
        value: String
        context: JSON
        translatedOn: DateTime
        translatedBy: CmsIdentity
    }

    type TranslatedCollection {
        collectionId: ID!
        languageCode: String!
        items: [TranslatedItem!]!
    }

    input TranslatedItemInput {
        itemId: String!
        value: String
    }

    type TranslatedCollectionResponse {
        data: TranslatedCollection
        error: CmsError
    }

    type SaveTranslatedCollectionResponse {
        data: TranslatedCollection
        error: CmsError
    }
    
    extend type TranslationsQuery {
        """Get the source collection with all the items that need to be translated."""
        getTranslatedCollection(collectionId: ID!, languageCode: String!): TranslatedCollectionResponse
    }

    extend type TranslationsMutation {
        saveTranslatedCollection(
            collectionId: ID!
            languageCode: String!
            items: [TranslatedItemInput!]!
        ): SaveTranslatedCollectionResponse
    }
`;
