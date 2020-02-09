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
        products: CmsManageRefMany
    }

    input CmsManageReviewInput {
        text: CmsManageTextInput
        products: CmsManageRefManyInput
    }

    input CmsManageReviewFilterInput {
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

    extend type CmsManageQuery {
        getReview(id: ID, locale: String): CmsManageReviewResponse

        listReviews(
            locale: String
            page: Int
            perPage: Int
            sort: JSON
            where: CmsManageReviewFilterInput
        ): CmsManageReviewListResponse
    }

    extend type CmsManageMutation {
        createReview(data: CmsManageReviewInput!): CmsManageReviewResponse
        updateReview(id: ID!, data: CmsManageReviewInput!): CmsManageReviewResponse
        deleteReview(id: ID!): CmsDeleteResponse
    }
`;
