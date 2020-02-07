export default /* GraphQL */ `
    "Product review"
    type CmsReadReview {
        id: ID
        createdBy: SecurityUser
        updatedBy: SecurityUser
        createdOn: DateTime
        updatedOn: DateTime
        savedOn: DateTime
        text(locale: String): String
        products(
            locale: String
            page: Int
            perPage: Int
            where: JSON
            sort: JSON
        ): CmsReadProductListResponse
    }

    input CmsReadReviewFilterInput {
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

    enum CmsReadReviewSorter {
        createdOn_ASC
        createdOn_DESC
        updatedOn_ASC
        updatedOn_DESC
        text_ASC
        text_DESC
    }

    type CmsReadReviewResponse {
        data: CmsReadReview
        error: CmsError
    }

    type CmsReadReviewListResponse {
        data: [CmsReadReview]
        meta: CmsListMeta
        error: CmsError
    }

    extend type CmsReadQuery {
        getReview(
            locale: String
            where: CmsReadReviewFilterInput
            sort: [CmsReadReviewSorter]
        ): CmsReadReviewResponse

        listReviews(
            locale: String
            page: Int
            perPage: Int
            where: CmsReadReviewFilterInput
            sort: [CmsReadReviewSorter]
        ): CmsReadReviewListResponse
    }
`;
