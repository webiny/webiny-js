export default /* GraphQL */ `
    "Product review"
    type CmsManageReview {
        id: ID
        createdBy: SecurityUser
        updatedBy: SecurityUser
        createdOn: DateTime
        updatedOn: DateTime
        savedOn: DateTime
        text: CmsManageText
        product: CmsManageRefOne
        rating: CmsManageFloat
    }

    input CmsManageReviewInput {
        text: CmsManageTextInput
        product: CmsManageRefOneInput
        rating: CmsManageFloatInput
    }

    input CmsManageReviewGetWhereInput {
        id: ID!
    }

    input CmsManageReviewListWhereInput {
        id: ID
        id_not: ID
        id_in: [ID]
        id_not_in: [ID]

        # Matches if the field is equal to the given value
        text: String

        # Matches if the field is not equal to the given value
        text_not: String

        # Matches if the field exists
        text_exists: Boolean

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

        # Matches if the field exists
        rating_exists: Boolean

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

    input CmsManageReviewUpdateWhereInput {
        id: ID!
    }

    input CmsManageReviewDeleteWhereInput {
        id: ID!
    }

    type CmsManageReviewResponse {
        data: CmsManageReview
        error: CmsError
    }

    type CmsManageReviewListResponse {
        data: [CmsManageReview]
        meta: CmsListMeta
        error: CmsError
    }

    enum CmsManageReviewListSorter {
        createdOn_ASC
        createdOn_DESC
        updatedOn_ASC
        updatedOn_DESC
        text_ASC
        text_DESC
        rating_ASC
        rating_DESC
    }

    extend type CmsManageQuery {
        getReview(where: CmsManageReviewGetWhereInput!): CmsManageReviewResponse

        listReviews(
            page: Int
            perPage: Int
            sort: [CmsManageReviewListSorter]
            where: CmsManageReviewListWhereInput
        ): CmsManageReviewListResponse
    }

    extend type CmsManageMutation {
        createReview(data: CmsManageReviewInput!): CmsManageReviewResponse

        updateReview(
            where: CmsManageReviewUpdateWhereInput!
            data: CmsManageReviewInput!
        ): CmsManageReviewResponse

        deleteReview(where: CmsManageReviewDeleteWhereInput!): CmsDeleteResponse
    }
`;
