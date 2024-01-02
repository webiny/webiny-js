export default /* GraphQL */ `
    """
    Product review
    """
    type ReviewApiModel {
        id: ID!
        entryId: String!

        createdOn: DateTime! @deprecated(reason: "Use 'revisionCreatedOn' or 'entryCreatedOn''.")
        savedOn: DateTime! @deprecated(reason: "Use 'revisionSavedOn' or 'entrySavedOn'.")
        createdBy: CmsIdentity! @deprecated(reason: "Use 'revisionCreatedBy' or 'entryCreatedBy'.")
        ownedBy: CmsIdentity! @deprecated(reason: "Use 'entryCreatedBy.")
        modifiedBy: CmsIdentity
            @deprecated(reason: "Use 'revisionModifiedBy' or 'entryModifiedBy'.")

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

        revisionCreatedOn: DateTime!
        revisionSavedOn: DateTime!
        revisionModifiedOn: DateTime
        revisionFirstPublishedOn: DateTime
        revisionLastPublishedOn: DateTime
        revisionCreatedBy: CmsIdentity!
        revisionSavedBy: CmsIdentity!
        revisionModifiedBy: CmsIdentity
        revisionFirstPublishedBy: CmsIdentity
        revisionLastPublishedBy: CmsIdentity
        entryCreatedOn: DateTime!
        entrySavedOn: DateTime!
        entryModifiedOn: DateTime
        entryFirstPublishedOn: DateTime
        entryLastPublishedOn: DateTime
        entryCreatedBy: CmsIdentity!
        entrySavedBy: CmsIdentity!
        entryModifiedBy: CmsIdentity
        entryFirstPublishedBy: CmsIdentity
        entryLastPublishedBy: CmsIdentity

        status: String
        """
        CAUTION: this field is resolved by making an extra query to DB.
        RECOMMENDATION: Use it only with "get" queries (avoid in "list")
        """
        revisions: [ReviewApiModel!]
        title: String
        description: String
        image: String
        """
        Custom meta data stored in the root of the entry object.
        """
        data: JSON
    }

    input ReviewApiModelMetaInput {
        status: String

        revisionCreatedOn: DateTime
        revisionSavedOn: DateTime
        revisionModifiedOn: DateTime
        revisionFirstPublishedOn: DateTime
        revisionLastPublishedOn: DateTime
        revisionCreatedBy: CmsIdentityInput
        revisionSavedBy: CmsIdentityInput
        revisionModifiedBy: CmsIdentityInput
        revisionFirstPublishedBy: CmsIdentityInput
        revisionLastPublishedBy: CmsIdentityInput
        entryCreatedOn: DateTime
        entrySavedOn: DateTime
        entryModifiedOn: DateTime
        entryFirstPublishedOn: DateTime
        entryLastPublishedOn: DateTime
        entryCreatedBy: CmsIdentityInput
        entrySavedBy: CmsIdentityInput
        entryModifiedBy: CmsIdentityInput
        entryFirstPublishedBy: CmsIdentityInput
        entryLastPublishedBy: CmsIdentityInput
    }

    input ReviewApiModelInput {
        id: ID

        # Set status of the entry.
        status: String

        # Set a different date/time as the creation date/time of the entry.
        createdOn: DateTime @deprecated(reason: "Use 'revisionCreatedOn' or 'entryCreatedOn'.")

        # Set a different date/time as the last modification date/time of the entry.
        savedOn: DateTime @deprecated(reason: "Use 'revisionSavedOn' or 'entrySavedOn'.")

        # Set a different date/time as the publication date/time of the entry.
        publishedOn: DateTime
            @deprecated(reason: "Use 'revisionPublishedOn' or 'entryPublishedOn'.")

        # Set a different identity as the creator of the entry.
        createdBy: CmsIdentityInput
            @deprecated(reason: "Use 'revisionCreatedBy' or 'entryCreatedBy'.")

        # Set a different identity as the last editor of the entry.
        modifiedBy: CmsIdentityInput
            @deprecated(reason: "Use 'revisionModifiedBy' or 'entryModifiedBy'.")

        # Set a different identity as the owner of the entry.
        ownedBy: CmsIdentityInput @deprecated(reason: "Use 'revisionOwnedBy' or 'entryOwnedBy'.")

        wbyAco_location: WbyAcoLocationInput

        meta: ReviewApiModelMetaInput

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

    input ReviewApiModelMetaWhereInput {
        revisionCreatedOn: DateTime
        revisionSavedOn: DateTime
        revisionModifiedOn: DateTime
        revisionFirstPublishedOn: DateTime
        revisionLastPublishedOn: DateTime
        revisionCreatedBy: CmsIdentityInput
        revisionSavedBy: CmsIdentityInput
        revisionModifiedBy: CmsIdentityInput
        revisionFirstPublishedBy: CmsIdentityInput
        revisionLastPublishedBy: CmsIdentityInput
        entryCreatedOn: DateTime
        entrySavedOn: DateTime
        entryModifiedOn: DateTime
        entryFirstPublishedOn: DateTime
        entryLastPublishedOn: DateTime
        entryCreatedBy: CmsIdentityInput
        entrySavedBy: CmsIdentityInput
        entryModifiedBy: CmsIdentityInput
        entryFirstPublishedBy: CmsIdentityInput
        entryLastPublishedBy: CmsIdentityInput
    }

    input ReviewApiModelListWhereMetaInput {
        revisionCreatedOn: DateTime
        revisionCreatedOn_gt: DateTime
        revisionCreatedOn_gte: DateTime
        revisionCreatedOn_lt: DateTime
        revisionCreatedOn_lte: DateTime
        revisionCreatedOn_between: [DateTime!]
        revisionCreatedOn_not_between: [DateTime!]
        revisionSavedOn: DateTime
        revisionSavedOn_gt: DateTime
        revisionSavedOn_gte: DateTime
        revisionSavedOn_lt: DateTime
        revisionSavedOn_lte: DateTime
        revisionSavedOn_between: [DateTime!]
        revisionSavedOn_not_between: [DateTime!]
        revisionModifiedOn: DateTime
        revisionModifiedOn_gt: DateTime
        revisionModifiedOn_gte: DateTime
        revisionModifiedOn_lt: DateTime
        revisionModifiedOn_lte: DateTime
        revisionModifiedOn_between: [DateTime!]
        revisionModifiedOn_not_between: [DateTime!]
        revisionFirstPublishedOn: DateTime
        revisionFirstPublishedOn_gt: DateTime
        revisionFirstPublishedOn_gte: DateTime
        revisionFirstPublishedOn_lt: DateTime
        revisionFirstPublishedOn_lte: DateTime
        revisionFirstPublishedOn_between: [DateTime!]
        revisionFirstPublishedOn_not_between: [DateTime!]
        revisionLastPublishedOn: DateTime
        revisionLastPublishedOn_gt: DateTime
        revisionLastPublishedOn_gte: DateTime
        revisionLastPublishedOn_lt: DateTime
        revisionLastPublishedOn_lte: DateTime
        revisionLastPublishedOn_between: [DateTime!]
        revisionLastPublishedOn_not_between: [DateTime!]
        revisionCreatedBy: ID
        revisionCreatedBy_not: ID
        revisionCreatedBy_in: [ID!]
        revisionCreatedBy_not_in: [ID!]
        revisionSavedBy: ID
        revisionSavedBy_not: ID
        revisionSavedBy_in: [ID!]
        revisionSavedBy_not_in: [ID!]
        revisionModifiedBy: ID
        revisionModifiedBy_not: ID
        revisionModifiedBy_in: [ID!]
        revisionModifiedBy_not_in: [ID!]
        revisionFirstPublishedBy: ID
        revisionFirstPublishedBy_not: ID
        revisionFirstPublishedBy_in: [ID!]
        revisionFirstPublishedBy_not_in: [ID!]
        revisionLastPublishedBy: ID
        revisionLastPublishedBy_not: ID
        revisionLastPublishedBy_in: [ID!]
        revisionLastPublishedBy_not_in: [ID!]
        entryCreatedOn: DateTime
        entryCreatedOn_gt: DateTime
        entryCreatedOn_gte: DateTime
        entryCreatedOn_lt: DateTime
        entryCreatedOn_lte: DateTime
        entryCreatedOn_between: [DateTime!]
        entryCreatedOn_not_between: [DateTime!]
        entrySavedOn: DateTime
        entrySavedOn_gt: DateTime
        entrySavedOn_gte: DateTime
        entrySavedOn_lt: DateTime
        entrySavedOn_lte: DateTime
        entrySavedOn_between: [DateTime!]
        entrySavedOn_not_between: [DateTime!]
        entryModifiedOn: DateTime
        entryModifiedOn_gt: DateTime
        entryModifiedOn_gte: DateTime
        entryModifiedOn_lt: DateTime
        entryModifiedOn_lte: DateTime
        entryModifiedOn_between: [DateTime!]
        entryModifiedOn_not_between: [DateTime!]
        entryFirstPublishedOn: DateTime
        entryFirstPublishedOn_gt: DateTime
        entryFirstPublishedOn_gte: DateTime
        entryFirstPublishedOn_lt: DateTime
        entryFirstPublishedOn_lte: DateTime
        entryFirstPublishedOn_between: [DateTime!]
        entryFirstPublishedOn_not_between: [DateTime!]
        entryLastPublishedOn: DateTime
        entryLastPublishedOn_gt: DateTime
        entryLastPublishedOn_gte: DateTime
        entryLastPublishedOn_lt: DateTime
        entryLastPublishedOn_lte: DateTime
        entryLastPublishedOn_between: [DateTime!]
        entryLastPublishedOn_not_between: [DateTime!]
        entryCreatedBy: ID
        entryCreatedBy_not: ID
        entryCreatedBy_in: [ID!]
        entryCreatedBy_not_in: [ID!]
        entrySavedBy: ID
        entrySavedBy_not: ID
        entrySavedBy_in: [ID!]
        entrySavedBy_not_in: [ID!]
        entryModifiedBy: ID
        entryModifiedBy_not: ID
        entryModifiedBy_in: [ID!]
        entryModifiedBy_not_in: [ID!]
        entryFirstPublishedBy: ID
        entryFirstPublishedBy_not: ID
        entryFirstPublishedBy_in: [ID!]
        entryFirstPublishedBy_not_in: [ID!]
        entryLastPublishedBy: ID
        entryLastPublishedBy_not: ID
        entryLastPublishedBy_in: [ID!]
        entryLastPublishedBy_not_in: [ID!]
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
        publishedOn: DateTime
        publishedOn_gt: DateTime
        publishedOn_gte: DateTime
        publishedOn_lt: DateTime
        publishedOn_lte: DateTime
        publishedOn_between: [DateTime!]
        publishedOn_not_between: [DateTime!]
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

        meta: ReviewApiModelListWhereMetaInput
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
        metaRevisionCreatedOn_ASC
        metaRevisionCreatedOn_DESC
        metaRevisionSavedOn_ASC
        metaRevisionSavedOn_DESC
        metaRevisionModifiedOn_ASC
        metaRevisionModifiedOn_DESC
        metaRevisionFirstPublishedOn_ASC
        metaRevisionFirstPublishedOn_DESC
        metaRevisionLastPublishedOn_ASC
        metaRevisionLastPublishedOn_DESC
        metaEntryCreatedOn_ASC
        metaEntryCreatedOn_DESC
        metaEntrySavedOn_ASC
        metaEntrySavedOn_DESC
        metaEntryModifiedOn_ASC
        metaEntryModifiedOn_DESC
        metaEntryFirstPublishedOn_ASC
        metaEntryFirstPublishedOn_DESC
        metaEntryLastPublishedOn_ASC
        metaEntryLastPublishedOn_DESC
        text_ASC
        text_DESC
        rating_ASC
        rating_DESC
    }

    extend type Query {
        getReviewApiModel(
            revision: ID
            entryId: ID
            status: CmsEntryStatusType
        ): ReviewApiModelResponse

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
        createReviewApiModel(
            data: ReviewApiModelInput!
            options: CreateCmsEntryOptionsInput
        ): ReviewApiModelResponse

        createReviewApiModelFrom(
            revision: ID!
            data: ReviewApiModelInput
            options: CreateRevisionCmsEntryOptionsInput
        ): ReviewApiModelResponse

        updateReviewApiModel(
            revision: ID!
            data: ReviewApiModelInput!
            options: UpdateCmsEntryOptionsInput
        ): ReviewApiModelResponse

        validateReviewApiModel(
            revision: ID
            data: ReviewApiModelInput!
        ): CmsEntryValidationResponse!

        moveReviewApiModel(revision: ID!, folderId: ID!): ReviewApiModelMoveResponse

        deleteReviewApiModel(revision: ID!, options: CmsDeleteEntryOptions): CmsDeleteResponse

        deleteMultipleReviewsApiModel(entries: [ID!]!): CmsDeleteMultipleResponse!

        publishReviewApiModel(
            revision: ID!
            options: CmsPublishEntryOptionsInput
        ): ReviewApiModelResponse

        republishReviewApiModel(revision: ID!): ReviewApiModelResponse

        unpublishReviewApiModel(revision: ID!): ReviewApiModelResponse
    }
`;
