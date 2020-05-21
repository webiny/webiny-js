export default /* GraphQL */ `
    "Product review"
    type Review {
        id: ID
        createdBy: SecurityUser
        updatedBy: SecurityUser
        createdOn: DateTime
        updatedOn: DateTime
        savedOn: DateTime
        text(locale: String): String
        product(locale: String): Product
        rating(locale: String): Number
    }

    input ReviewGetWhereInput {
        id: ID
    }

    input ReviewListWhereInput {
        id: ID
        id_not: ID
        id_in: [ID]
        id_not_in: [ID]
    }

    enum ReviewListSorter {
        id_ASC
        id_DESC
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
        getReview(locale: String, where: ReviewGetWhereInput!): ReviewResponse

        listReviews(
            locale: String
            where: ReviewListWhereInput
            sort: [ReviewListSorter]
            limit: Int
            after: String
            before: String
        ): ReviewListResponse
    }
`;
