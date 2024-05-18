export default /* GraphQL */ `
    """
    Product review
    """
    type ReviewApiModel {
        id: ID!
        entryId: String!
        modelId: String!

        createdOn: DateTime!
        modifiedOn: DateTime
        savedOn: DateTime!
        deletedOn: DateTime
        restoredOn: DateTime
        firstPublishedOn: DateTime
        lastPublishedOn: DateTime
        createdBy: CmsIdentity!
        modifiedBy: CmsIdentity
        savedBy: CmsIdentity!
        deletedBy: CmsIdentity
        restoredBy: CmsIdentity
        firstPublishedBy: CmsIdentity
        lastPublishedBy: CmsIdentity
        revisionCreatedOn: DateTime!
        revisionModifiedOn: DateTime
        revisionSavedOn: DateTime!
        revisionDeletedOn: DateTime
        revisionRestoredOn: DateTime
        revisionFirstPublishedOn: DateTime
        revisionLastPublishedOn: DateTime
        revisionCreatedBy: CmsIdentity!
        revisionModifiedBy: CmsIdentity
        revisionSavedBy: CmsIdentity!
        revisionDeletedBy: CmsIdentity
        revisionRestoredBy: CmsIdentity
        revisionFirstPublishedBy: CmsIdentity
        revisionLastPublishedBy: CmsIdentity

        text: String
        product(populate: Boolean = true): ProductApiSingular
        rating: Number
        author(populate: Boolean = true): AuthorApiModel
    }

    input ReviewApiModelGetWhereInput {
        id: ID
        entryId: String
        text: String
        rating: Number
    }

    input ReviewApiModelListWhereInput {
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
        modifiedOn: DateTime
        modifiedOn_gt: DateTime
        modifiedOn_gte: DateTime
        modifiedOn_lt: DateTime
        modifiedOn_lte: DateTime
        modifiedOn_between: [DateTime!]
        modifiedOn_not_between: [DateTime!]
        savedOn: DateTime
        savedOn_gt: DateTime
        savedOn_gte: DateTime
        savedOn_lt: DateTime
        savedOn_lte: DateTime
        savedOn_between: [DateTime!]
        savedOn_not_between: [DateTime!]
        deletedOn: DateTime
        deletedOn_gt: DateTime
        deletedOn_gte: DateTime
        deletedOn_lt: DateTime
        deletedOn_lte: DateTime
        deletedOn_between: [DateTime!]
        deletedOn_not_between: [DateTime!]
        restoredOn: DateTime
        restoredOn_gt: DateTime
        restoredOn_gte: DateTime
        restoredOn_lt: DateTime
        restoredOn_lte: DateTime
        restoredOn_between: [DateTime!]
        restoredOn_not_between: [DateTime!]
        firstPublishedOn: DateTime
        firstPublishedOn_gt: DateTime
        firstPublishedOn_gte: DateTime
        firstPublishedOn_lt: DateTime
        firstPublishedOn_lte: DateTime
        firstPublishedOn_between: [DateTime!]
        firstPublishedOn_not_between: [DateTime!]
        lastPublishedOn: DateTime
        lastPublishedOn_gt: DateTime
        lastPublishedOn_gte: DateTime
        lastPublishedOn_lt: DateTime
        lastPublishedOn_lte: DateTime
        lastPublishedOn_between: [DateTime!]
        lastPublishedOn_not_between: [DateTime!]
        createdBy: ID
        createdBy_not: ID
        createdBy_in: [ID!]
        createdBy_not_in: [ID!]
        modifiedBy: ID
        modifiedBy_not: ID
        modifiedBy_in: [ID!]
        modifiedBy_not_in: [ID!]
        savedBy: ID
        savedBy_not: ID
        savedBy_in: [ID!]
        savedBy_not_in: [ID!]
        deletedBy: ID
        deletedBy_not: ID
        deletedBy_in: [ID!]
        deletedBy_not_in: [ID!]
        restoredBy: ID
        restoredBy_not: ID
        restoredBy_in: [ID!]
        restoredBy_not_in: [ID!]
        firstPublishedBy: ID
        firstPublishedBy_not: ID
        firstPublishedBy_in: [ID!]
        firstPublishedBy_not_in: [ID!]
        lastPublishedBy: ID
        lastPublishedBy_not: ID
        lastPublishedBy_in: [ID!]
        lastPublishedBy_not_in: [ID!]
        revisionCreatedOn: DateTime
        revisionCreatedOn_gt: DateTime
        revisionCreatedOn_gte: DateTime
        revisionCreatedOn_lt: DateTime
        revisionCreatedOn_lte: DateTime
        revisionCreatedOn_between: [DateTime!]
        revisionCreatedOn_not_between: [DateTime!]
        revisionModifiedOn: DateTime
        revisionModifiedOn_gt: DateTime
        revisionModifiedOn_gte: DateTime
        revisionModifiedOn_lt: DateTime
        revisionModifiedOn_lte: DateTime
        revisionModifiedOn_between: [DateTime!]
        revisionModifiedOn_not_between: [DateTime!]
        revisionSavedOn: DateTime
        revisionSavedOn_gt: DateTime
        revisionSavedOn_gte: DateTime
        revisionSavedOn_lt: DateTime
        revisionSavedOn_lte: DateTime
        revisionSavedOn_between: [DateTime!]
        revisionSavedOn_not_between: [DateTime!]
        revisionDeletedOn: DateTime
        revisionDeletedOn_gt: DateTime
        revisionDeletedOn_gte: DateTime
        revisionDeletedOn_lt: DateTime
        revisionDeletedOn_lte: DateTime
        revisionDeletedOn_between: [DateTime!]
        revisionDeletedOn_not_between: [DateTime!]
        revisionRestoredOn: DateTime
        revisionRestoredOn_gt: DateTime
        revisionRestoredOn_gte: DateTime
        revisionRestoredOn_lt: DateTime
        revisionRestoredOn_lte: DateTime
        revisionRestoredOn_between: [DateTime!]
        revisionRestoredOn_not_between: [DateTime!]
        revisionFirstPublishedOn: DateTime
        revisionFirstPublishedOn_gt: DateTime
        revisionFirstPublishedOn_gte: DateTime
        revisionFirstPublishedOn_lt: DateTime
        revisionFirstPublishedOn_lte: DateTime
        revisionFirstPublishedOn_between: [DateTime!]
        revisionFirstPublishedOn_not_between: [DateTime!]
        revisionLastPublishedOn: DateTime
        revisionLastPublishedOn_gt: DateTime
        revisionLastPublishedOn_gte: DateTime
        revisionLastPublishedOn_lt: DateTime
        revisionLastPublishedOn_lte: DateTime
        revisionLastPublishedOn_between: [DateTime!]
        revisionLastPublishedOn_not_between: [DateTime!]
        revisionCreatedBy: ID
        revisionCreatedBy_not: ID
        revisionCreatedBy_in: [ID!]
        revisionCreatedBy_not_in: [ID!]
        revisionModifiedBy: ID
        revisionModifiedBy_not: ID
        revisionModifiedBy_in: [ID!]
        revisionModifiedBy_not_in: [ID!]
        revisionSavedBy: ID
        revisionSavedBy_not: ID
        revisionSavedBy_in: [ID!]
        revisionSavedBy_not_in: [ID!]
        revisionDeletedBy: ID
        revisionDeletedBy_not: ID
        revisionDeletedBy_in: [ID!]
        revisionDeletedBy_not_in: [ID!]
        revisionRestoredBy: ID
        revisionRestoredBy_not: ID
        revisionRestoredBy_in: [ID!]
        revisionRestoredBy_not_in: [ID!]
        revisionFirstPublishedBy: ID
        revisionFirstPublishedBy_not: ID
        revisionFirstPublishedBy_in: [ID!]
        revisionFirstPublishedBy_not_in: [ID!]
        revisionLastPublishedBy: ID
        revisionLastPublishedBy_not: ID
        revisionLastPublishedBy_in: [ID!]
        revisionLastPublishedBy_not_in: [ID!]

        text: String
        text_not: String
        text_in: [String]
        text_not_in: [String]
        text_contains: String
        text_not_contains: String
        text_startsWith: String
        text_not_startsWith: String

        product: RefFieldWhereInput

        rating: Number
        rating_not: Number
        rating_in: [Number]
        rating_not_in: [Number]
        rating_lt: Number
        rating_lte: Number
        rating_gt: Number
        rating_gte: Number
        # there must be two numbers sent in the array
        rating_between: [Number!]
        # there must be two numbers sent in the array
        rating_not_between: [Number!]

        author: RefFieldWhereInput

        AND: [ReviewApiModelListWhereInput!]
        OR: [ReviewApiModelListWhereInput!]
    }

    enum ReviewApiModelListSorter {
        id_ASC
        id_DESC
        createdOn_ASC
        createdOn_DESC
        modifiedOn_ASC
        modifiedOn_DESC
        savedOn_ASC
        savedOn_DESC
        deletedOn_ASC
        deletedOn_DESC
        restoredOn_ASC
        restoredOn_DESC
        firstPublishedOn_ASC
        firstPublishedOn_DESC
        lastPublishedOn_ASC
        lastPublishedOn_DESC
        revisionCreatedOn_ASC
        revisionCreatedOn_DESC
        revisionModifiedOn_ASC
        revisionModifiedOn_DESC
        revisionSavedOn_ASC
        revisionSavedOn_DESC
        revisionDeletedOn_ASC
        revisionDeletedOn_DESC
        revisionRestoredOn_ASC
        revisionRestoredOn_DESC
        revisionFirstPublishedOn_ASC
        revisionFirstPublishedOn_DESC
        revisionLastPublishedOn_ASC
        revisionLastPublishedOn_DESC
        text_ASC
        text_DESC
        rating_ASC
        rating_DESC
    }

    type ReviewApiModelResponse {
        data: ReviewApiModel
        error: CmsError
    }

    type ReviewApiModelListResponse {
        data: [ReviewApiModel]
        meta: CmsListMeta
        error: CmsError
    }

    extend type Query {
        getReviewApiModel(where: ReviewApiModelGetWhereInput!): ReviewApiModelResponse

        listReviewsApiModel(
            where: ReviewApiModelListWhereInput
            sort: [ReviewApiModelListSorter]
            limit: Int
            after: String
            search: String
        ): ReviewApiModelListResponse
    }
`;
