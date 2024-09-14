export const translatableCollectionSchema = /* GraphQL*/ `
    type TranslatableItem {
        itemId: String!
        value: String!
        context: JSON!
        modifiedOn: DateTime!
        modifiedBy: CmsIdentity!
    }

    type TranslatableCollection {
        collectionId: ID!
        lastModified: DateTime
        items: [TranslatableItem!]!
    }

    input TranslatableItemInput {
        itemId: String!
        value: String!
        context: JSON
    }

    type TranslatableCollectionResponse {
        data: TranslatableCollection
        error: CmsError
    }

    type SaveTranslatableCollectionResponse {
        data: TranslatableCollection
        error: CmsError
    }

    extend type TranslationsQuery {
        """Get the source collection with all the items that need to be translated."""
        getTranslatableCollection(collectionId: ID!): TranslatableCollectionResponse
    }

    extend type TranslationsMutation {
        saveTranslatableCollection(
            collectionId: ID!
            items: [TranslatableItemInput!]!
        ): SaveTranslatableCollectionResponse
    }
`;
