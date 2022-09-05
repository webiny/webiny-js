import { metaDataComment, revisionsComment } from "./snippets";

export default /* GraphQL */ `
    """
    Product review
    """
    type Review {
        id: ID!
        entryId: String!
        createdOn: DateTime!
        savedOn: DateTime!
        createdBy: CmsCreatedBy!
        ownedBy: CmsOwnedBy!
        meta: ReviewMeta
        text: String
        product: RefField
        rating: Number
        author: RefField
    }

    type ReviewMeta {
        modelId: String
        version: Int
        locked: Boolean
        publishedOn: DateTime
        status: String
        ${revisionsComment}
        revisions: [Review]
        title: String
        ${metaDataComment}
        data: JSON
    }

    input ReviewInput {
        text: String!
        product: RefFieldInput
        rating: Number
        author: RefFieldInput
    }

    input ReviewGetWhereInput {
        id: ID
        entryId: String
        text: String
        rating: Number
    }

    input ReviewListWhereInput {
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
        
        author: RefFieldWhereInput
    }

    type ReviewResponse {
        data: Review
        error: CmsError
    }
    
    type ReviewArrayResponse {
        data: [Review]
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
        savedOn_ASC
        savedOn_DESC
        createdOn_ASC
        createdOn_DESC
        text_ASC
        text_DESC
        rating_ASC
        rating_DESC
    }

    extend type Query {
        getReview(revision: ID, entryId: ID, status: CmsEntryStatusType): ReviewResponse
        
        getReviewRevisions(id: ID!): ReviewArrayResponse
        
        getReviewsByIds(revisions: [ID!]!): ReviewArrayResponse

        listReviews(
            where: ReviewListWhereInput
            sort: [ReviewListSorter]
            limit: Int
            after: String
        ): ReviewListResponse
    }

    extend type Mutation {
        createReview(data: ReviewInput!): ReviewResponse

        createReviewFrom(revision: ID!, data: ReviewInput): ReviewResponse

        updateReview(revision: ID!, data: ReviewInput!): ReviewResponse

        deleteReview(revision: ID!): CmsDeleteResponse

        publishReview(revision: ID!): ReviewResponse
    
        republishReview(revision: ID!): ReviewResponse

        unpublishReview(revision: ID!): ReviewResponse
        
        requestReviewReview(revision: ID!): ReviewResponse
        
        requestReviewChanges(revision: ID!): ReviewResponse
    }
`;
