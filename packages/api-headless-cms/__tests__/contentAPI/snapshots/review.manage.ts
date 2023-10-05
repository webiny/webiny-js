import { metaDataComment, revisionsComment } from "./snippets";

export default /* GraphQL */ `
    """
    Product review
    """
    type ReviewApiModel {
        id: ID!
        entryId: String!
        createdOn: DateTime!
        savedOn: DateTime!
        createdBy: CmsIdentity!
        ownedBy: CmsIdentity!
        modifiedBy: CmsIdentity
        meta: ReviewApiModelMeta
        text: String
        product: RefField
        rating: Number
        author: RefField
        # Advanced Content Organization - make required in 5.38.0
        wbyAco_location: WbyAcoLocation
    }

    type ReviewApiModelMeta {
        modelId: String
        version: Int
        locked: Boolean
        publishedOn: DateTime
        status: String
        ${revisionsComment}
        revisions: [ReviewApiModel!]
        title: String
        description: String
        image: String
        ${metaDataComment}
        data: JSON
    }

    input ReviewApiModelInput {
        id: ID
        wbyAco_location: WbyAcoLocationInput
        text: String
        product: RefFieldInput
        rating: Number
        author: RefFieldInput
    }

    input ReviewApiModelGetWhereInput {
        id: ID
        entryId: String
        text: String
        rating: Number
    }

    input ReviewApiModelListWhereInput {
        wbyAco_location: WbyAcoLocationWhereInput
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
        status: String
        status_not: String
        status_in: [String!]
        status_not_in: [String!]

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

    type ReviewApiModelResponse {
        data: ReviewApiModel
        error: CmsError
    }

    type ReviewApiModelMoveResponse {
        data: Boolean
        error: CmsError
    }
    
    type ReviewApiModelArrayResponse {
        data: [ReviewApiModel]
        error: CmsError
    }

    type ReviewApiModelListResponse {
        data: [ReviewApiModel]
        meta: CmsListMeta
        error: CmsError
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

    extend type Query {
        getReviewApiModel(revision: ID, entryId: ID, status: CmsEntryStatusType): ReviewApiModelResponse
        
        getReviewApiModelRevisions(id: ID!): ReviewApiModelArrayResponse
        
        getReviewsApiModelByIds(revisions: [ID!]!): ReviewApiModelArrayResponse

        listReviewsApiModel(
            where: ReviewApiModelListWhereInput
            sort: [ReviewApiModelListSorter]
            limit: Int
            after: String
            search: String
        ): ReviewApiModelListResponse
    }

    extend type Mutation {
        createReviewApiModel(data: ReviewApiModelInput!, options: CreateCmsEntryOptionsInput): ReviewApiModelResponse

        createReviewApiModelFrom(revision: ID!, data: ReviewApiModelInput, options: CreateRevisionCmsEntryOptionsInput): ReviewApiModelResponse

        updateReviewApiModel(revision: ID!, data: ReviewApiModelInput!, options: UpdateCmsEntryOptionsInput): ReviewApiModelResponse
        
        validateReviewApiModel(revision: ID, data: ReviewApiModelInput!): CmsEntryValidationResponse!
        
        moveReviewApiModel(revision: ID!, folderId: ID!): ReviewApiModelMoveResponse

        deleteReviewApiModel(
            revision: ID!
            options: CmsDeleteEntryOptions
        ): CmsDeleteResponse

        deleteMultipleReviewsApiModel(entries: [ID!]!): CmsDeleteMultipleResponse!

        publishReviewApiModel(revision: ID!): ReviewApiModelResponse
    
        republishReviewApiModel(revision: ID!): ReviewApiModelResponse

        unpublishReviewApiModel(revision: ID!): ReviewApiModelResponse
    }
`;
