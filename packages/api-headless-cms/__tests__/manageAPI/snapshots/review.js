export default /* GraphQL */ `
    "Product review"
    type CmsRefReviewProductLocalized {
      value: Product
      locale: ID!
    }
    
    type CmsRefReviewProduct {
      value(locale: String): Product
      values: [CmsRefReviewProductLocalized]!
    }
    type Review {
        id: ID
        createdBy: SecurityUser
        updatedBy: SecurityUser
        createdOn: DateTime
        updatedOn: DateTime
        savedOn: DateTime
        meta: ReviewMeta
        text: CmsText
        product: CmsRefReviewProduct
        rating: CmsNumber
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
        product: CmsRefInput
        rating: CmsNumberInput
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

    input ReviewUpdateWhereInput {
        id: ID
    }

    input ReviewDeleteWhereInput {
        id: ID
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
        id_ASC
        id_DESC
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
