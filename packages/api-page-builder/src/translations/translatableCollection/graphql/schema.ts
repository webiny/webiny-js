export const translatableCollectionSchema = /* GraphQL*/ `
    type TranslatableItem {
        itemId: String!
        value: String!
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
    }

    type TranslatableCollectionResponse {
        data: TranslatableCollection
        error: CmsError
    }

    type UpdateTranslatableCollectionResponse {
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
        ): UpdateTranslatableCollectionResponse
    }
`;
