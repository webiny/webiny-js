import { metaDataComment, revisionsComment } from "./snippets";

export default /* GraphQL */ `
    """
    Product category
    """
    type Category {
        id: ID!
        entryId: String!
        createdOn: DateTime!
        savedOn: DateTime!
        createdBy: CmsCreatedBy!
        ownedBy: CmsOwnedBy!
        meta: CategoryMeta
        title: String
        slug: String
    }

    type CategoryMeta {
        modelId: String
        version: Int
        locked: Boolean
        publishedOn: DateTime
        status: String
        ${revisionsComment}
        revisions: [Category]
        title: String
        ${metaDataComment}
        data: JSON
    }

    input CategoryInput {
        title: String!
        slug: String!
    }

    input CategoryGetWhereInput {
        id: ID
        entryId: String
        title: String
        slug: String
    }

    input CategoryListWhereInput {
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
    }

    type CategoryResponse {
        data: Category
        error: CmsError
    }
        
    type CategoryArrayResponse {
        data: [Category]
        error: CmsError
    }

    type CategoryListResponse {
        data: [Category]
        meta: CmsListMeta
        error: CmsError
    }

    enum CategoryListSorter {
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
        getCategory(revision: ID, entryId: ID, status: CmsEntryStatusType): CategoryResponse
        
        getCategoryRevisions(id: ID!): CategoryArrayResponse
        
        getCategoriesByIds(revisions: [ID!]!): CategoryArrayResponse

        listCategories(
            where: CategoryListWhereInput
            sort: [CategoryListSorter]
            limit: Int
            after: String
        ): CategoryListResponse
    }

    extend type Mutation {
        createCategory(data: CategoryInput!): CategoryResponse

        createCategoryFrom(revision: ID!, data: CategoryInput): CategoryResponse

        updateCategory(revision: ID!, data: CategoryInput!): CategoryResponse

        deleteCategory(revision: ID!): CmsDeleteResponse

        publishCategory(revision: ID!): CategoryResponse
    
        republishCategory(revision: ID!): CategoryResponse

        unpublishCategory(revision: ID!): CategoryResponse
        
        requestCategoryReview(revision: ID!): CategoryResponse
        
        requestCategoryChanges(revision: ID!): CategoryResponse
    }
`;
