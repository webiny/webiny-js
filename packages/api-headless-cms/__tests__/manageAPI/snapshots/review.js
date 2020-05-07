export default /* GraphQL */ `
    "Product review"
    type Review {
        id: ID
        createdBy: SecurityUser
        updatedBy: SecurityUser
        createdOn: DateTime
        updatedOn: DateTime
        savedOn: DateTime
        meta: ReviewMeta
        text: CmsText
        product: CmsRefOne
        rating: CmsFloat
    }

    type ReviewMeta {
        model: String
        environment: ID
        parent: ID
        version: Int
        latestVersion: Boolean
        locked: Boolean
        published: Boolean
        publishedOn: DateTime
        status: String
        revisions: [Review]
        title: CmsText
    }

    input ReviewInput {
        text: CmsTextInput
        product: CmsRefOneInput
        rating: CmsFloatInput
    }

    input ReviewGetWhereInput {
        id: ID!
    }

    input ReviewListWhereInput {
        id: ID
        id_not: ID
        id_in: [ID]
        id_not_in: [ID]

        # Matches if the field is equal to the given value
        text: String

        # Matches if the field is not equal to the given value
        text_not: String

        # Matches if the field value equal one of the given values
        text_in: [String]

        # Matches if the field value does not equal any of the given values
        text_not_in: [String]

        # Matches if given value is a substring of the the field value
        text_contains: String

        # Matches if given value is not a substring of the the field value
        text_not_contains: String

        # Matches if the field is equal to the given value
        rating: Float

        # Matches if the field is not equal to the given value
        rating_not: Float

        # Matches if the field value equal one of the given values
        rating_in: [Float]

        # Matches if the field value does not equal any of the given values
        rating_not_in: [Float]

        # Matches if the field value is strictly smaller than the given value
        rating_lt: Float

        # Matches if the field value is smaller than or equal to the given value
        rating_lte: Float

        # Matches if the field value is strictly greater than the given value
        rating_gt: Float

        # Matches if the field value is greater than or equal to the given value
        rating_gte: Float
    }

    input ReviewUpdateWhereInput {
        id: ID!
    }

    input ReviewDeleteWhereInput {
        id: ID!
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

    enum ReviewListSorter {
        createdOn_ASC
        createdOn_DESC
        updatedOn_ASC
        updatedOn_DESC
        text_ASC
        text_DESC
        rating_ASC
        rating_DESC
    }

    extend type Query {
        getReview(where: ReviewGetWhereInput!): ReviewResponse

        listReviews(
            where: ReviewListWhereInput
            sort: [ReviewListSorter]
            limit: Int
            after: String
            before: String
        ): ReviewListResponse
    }

    extend type Mutation {
        createReview(data: ReviewInput!): ReviewResponse

        createReviewFrom(revision: ID!, data: ReviewInput): ReviewResponse

        updateReview(where: ReviewUpdateWhereInput!, data: ReviewInput!): ReviewResponse

        deleteReview(where: ReviewDeleteWhereInput!): CmsDeleteResponse

        publishReview(revision: ID!): ReviewResponse

        unpublishReview(revision: ID!): ReviewResponse
    }
`;
