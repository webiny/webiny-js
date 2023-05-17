import { metaDataComment, revisionsComment } from "./snippets";

export default /* GraphQL */ `
    """
    Product category
    """
    type CategoryApiNameWhichIsABitDifferentThanModelId {
        id: ID!
        entryId: String!
        createdOn: DateTime!
        savedOn: DateTime!
        createdBy: CmsIdentity!
        ownedBy: CmsIdentity!
        modifiedBy: CmsIdentity
        meta: CategoryApiNameWhichIsABitDifferentThanModelIdMeta
        title: String
        slug: String
    }

    type CategoryApiNameWhichIsABitDifferentThanModelIdMeta {
        modelId: String
        version: Int
        locked: Boolean
        publishedOn: DateTime
        status: String
        ${revisionsComment}
        revisions: [CategoryApiNameWhichIsABitDifferentThanModelId!]
        title: String
        description: String
        image: String
        ${metaDataComment}
        data: JSON
    }

    input CategoryApiNameWhichIsABitDifferentThanModelIdInput {
        id: ID
        title: String!
        slug: String!
    }

    input CategoryApiNameWhichIsABitDifferentThanModelIdGetWhereInput {
        id: ID
        entryId: String
        title: String
        slug: String
    }

    input CategoryApiNameWhichIsABitDifferentThanModelIdListWhereInput {
        id: ID
        id_not: ID
        id_in: [ID!]
        id_not_in: [ID!]
        entryId: String
        entryId_not: String
        entryId_in: [String!]
        entryId_not_in: [String!]
        createdOn: DateTime
        createdOn_gt: DateTime
        createdOn_gte: DateTime
        createdOn_lt: DateTime
        createdOn_lte: DateTime
        createdOn_between: [DateTime!]
        createdOn_not_between: [DateTime!]
        savedOn: DateTime
        savedOn_gt: DateTime
        savedOn_gte: DateTime
        savedOn_lt: DateTime
        savedOn_lte: DateTime
        savedOn_between: [DateTime!]
        savedOn_not_between: [DateTime!]
        createdBy: String
        createdBy_not: String
        createdBy_in: [String!]
        createdBy_not_in: [String!]
        ownedBy: String
        ownedBy_not: String
        ownedBy_in: [String!]
        ownedBy_not_in: [String!]
        status: String
        status_not: String
        status_in: [String!]
        status_not_in: [String!]

        title: String
        title_not: String
        title_in: [String]
        title_not_in: [String]
        title_contains: String
        title_not_contains: String

        slug: String
        slug_not: String
        slug_in: [String]
        slug_not_in: [String]
        slug_contains: String
        slug_not_contains: String
    
        AND: [CategoryApiNameWhichIsABitDifferentThanModelIdListWhereInput!]
        OR: [CategoryApiNameWhichIsABitDifferentThanModelIdListWhereInput!]
    }

    type CategoryApiNameWhichIsABitDifferentThanModelIdResponse {
        data: CategoryApiNameWhichIsABitDifferentThanModelId
        error: CmsError
    }
    
    type CategoryApiNameWhichIsABitDifferentThanModelIdArrayResponse {
        data: [CategoryApiNameWhichIsABitDifferentThanModelId]
        error: CmsError
    }

    type CategoryApiNameWhichIsABitDifferentThanModelIdListResponse {
        data: [CategoryApiNameWhichIsABitDifferentThanModelId]
        meta: CmsListMeta
        error: CmsError
    }

    enum CategoryApiNameWhichIsABitDifferentThanModelIdListSorter {
        id_ASC
        id_DESC
        savedOn_ASC
        savedOn_DESC
        createdOn_ASC
        createdOn_DESC
        title_ASC
        title_DESC
        slug_ASC
        slug_DESC
    }

    extend type Query {
        getCategoryApiNameWhichIsABitDifferentThanModelId(revision: ID, entryId: ID, status: CmsEntryStatusType): CategoryApiNameWhichIsABitDifferentThanModelIdResponse
        
        getCategoryApiNameWhichIsABitDifferentThanModelIdRevisions(id: ID!): CategoryApiNameWhichIsABitDifferentThanModelIdArrayResponse
        
        getCategoriesApiModelByIds(revisions: [ID!]!): CategoryApiNameWhichIsABitDifferentThanModelIdArrayResponse

        listCategoriesApiModel(
            where: CategoryApiNameWhichIsABitDifferentThanModelIdListWhereInput
            sort: [CategoryApiNameWhichIsABitDifferentThanModelIdListSorter]
            limit: Int
            after: String
        ): CategoryApiNameWhichIsABitDifferentThanModelIdListResponse
    }

    extend type Mutation {
        createCategoryApiNameWhichIsABitDifferentThanModelId(data: CategoryApiNameWhichIsABitDifferentThanModelIdInput!): CategoryApiNameWhichIsABitDifferentThanModelIdResponse

        createCategoryApiNameWhichIsABitDifferentThanModelIdFrom(revision: ID!, data: CategoryApiNameWhichIsABitDifferentThanModelIdInput): CategoryApiNameWhichIsABitDifferentThanModelIdResponse

        updateCategoryApiNameWhichIsABitDifferentThanModelId(revision: ID!, data: CategoryApiNameWhichIsABitDifferentThanModelIdInput!): CategoryApiNameWhichIsABitDifferentThanModelIdResponse

        deleteCategoryApiNameWhichIsABitDifferentThanModelId(
            revision: ID!
            options: CmsDeleteEntryOptions
        ): CmsDeleteResponse

        deleteMultipleCategoriesApiModel(entries: [ID!]!): CmsDeleteMultipleResponse!

        publishCategoryApiNameWhichIsABitDifferentThanModelId(revision: ID!): CategoryApiNameWhichIsABitDifferentThanModelIdResponse
    
        republishCategoryApiNameWhichIsABitDifferentThanModelId(revision: ID!): CategoryApiNameWhichIsABitDifferentThanModelIdResponse

        unpublishCategoryApiNameWhichIsABitDifferentThanModelId(revision: ID!): CategoryApiNameWhichIsABitDifferentThanModelIdResponse
    }
`;
