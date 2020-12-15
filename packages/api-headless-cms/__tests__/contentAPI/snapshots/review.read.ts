export default /* GraphQL */ `
    """
    Product review
    """
    type Review {
        id: ID
        createdOn: DateTime
        updatedOn: DateTime
        savedOn: DateTime
        text: String
        product: Product
        rating: Number
    }

    input ReviewGetWhereInput {
        id: ID
        text: String
        rating: Number
    }

    input ReviewListWhereInput {
        id: ID
        id_not: ID
        id_in: [ID]
        id_not_in: [ID]

        text: String
        text_not: String
        text_in: [String]
        text_not_in: [String]
        text_contains: String
        text_not_contains: String

        rating: Number
        rating_not: Number
        rating_in: [Number]
        rating_not_in: [Number]
        rating_lt: Number
        rating_lte: Number
        rating_gt: Number
        rating_gte: Number
    }

    enum ReviewListSorter {
        id_ASC
        id_DESC
        text_ASC
        text_DESC
        rating_ASC
        rating_DESC
    }

    type ReviewResponse {
        data: Review
        error: CmsError
    }

    type ReviewListResponse {
        data: [Review]
        meta: CmsListMeta
        error: CmsError
    }

    extend type Query {
        getReview(where: ReviewGetWhereInput!): ReviewResponse

        listReviews(
            where: ReviewListWhereInput
            sort: [ReviewListSorter]
            limit: Int
            after: String
        ): ReviewListResponse
    }
`;
