export default /* GraphQL */ `
    """
    Product review
    """
    type ReviewApiModel {
        id: ID!
        entryId: String!
        modelId: String!
        createdOn: DateTime!
        savedOn: DateTime!
        createdBy: CmsIdentity!
        ownedBy: CmsIdentity!
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

        text: String
        text_not: String
        text_in: [String]
        text_not_in: [String]
        text_contains: String
        text_not_contains: String

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
        savedOn_ASC
        savedOn_DESC
        createdOn_ASC
        createdOn_DESC
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
        ): ReviewApiModelListResponse
    }
`;
