export default /* GraphQL */ `
    """
    Product category
    """
    type CategoryApiNameWhichIsABitDifferentThanModelId {
        id: ID!
        entryId: String!

        createdOn: DateTime
        modifiedOn: DateTime
        savedOn: DateTime
        deletedOn: DateTime
        restoredOn: DateTime
        firstPublishedOn: DateTime
        lastPublishedOn: DateTime
        createdBy: CmsIdentity
        modifiedBy: CmsIdentity
        savedBy: CmsIdentity
        deletedBy: CmsIdentity
        restoredBy: CmsIdentity
        firstPublishedBy: CmsIdentity
        lastPublishedBy: CmsIdentity
        revisionCreatedOn: DateTime
        revisionModifiedOn: DateTime
        revisionSavedOn: DateTime
        revisionDeletedOn: DateTime
        revisionRestoredOn: DateTime
        revisionFirstPublishedOn: DateTime
        revisionLastPublishedOn: DateTime
        revisionCreatedBy: CmsIdentity
        revisionModifiedBy: CmsIdentity
        revisionSavedBy: CmsIdentity
        revisionDeletedBy: CmsIdentity
        revisionRestoredBy: CmsIdentity
        revisionFirstPublishedBy: CmsIdentity
        revisionLastPublishedBy: CmsIdentity

        publishedOn: DateTime
            @deprecated(
                reason: "Field was removed with the 5.39.0 release. Use 'firstPublishedOn' or 'lastPublishedOn' field."
            )
        ownedBy: CmsIdentity
            @deprecated(reason: "Field was removed with the 5.39.0 release. Use 'createdBy' field.")

        meta: CategoryApiNameWhichIsABitDifferentThanModelIdMeta
        title: String
        slug: String
        # Advanced Content Organization - make required in 5.38.0
        wbyAco_location: WbyAcoLocation
    }

    type CategoryApiNameWhichIsABitDifferentThanModelIdMeta {
        modelId: String
        version: Int
        locked: Boolean

        status: String
        """
        CAUTION: this field is resolved by making an extra query to DB.
        RECOMMENDATION: Use it only with "get" queries (avoid in "list")
        """
        revisions: [CategoryApiNameWhichIsABitDifferentThanModelId!]
        title: String
        description: String
        image: String
        """
        Custom meta data stored in the root of the entry object.
        """
        data: JSON
    }

    input CategoryApiNameWhichIsABitDifferentThanModelIdInput {
        id: ID

        # Set status of the entry.
        status: String

        createdOn: DateTime
        modifiedOn: DateTime
        savedOn: DateTime
        deletedOn: DateTime
        restoredOn: DateTime
        firstPublishedOn: DateTime
        lastPublishedOn: DateTime
        createdBy: CmsIdentityInput
        modifiedBy: CmsIdentityInput
        savedBy: CmsIdentityInput
        deletedBy: CmsIdentityInput
        restoredBy: CmsIdentityInput
        firstPublishedBy: CmsIdentityInput
        lastPublishedBy: CmsIdentityInput
        revisionCreatedOn: DateTime
        revisionModifiedOn: DateTime
        revisionSavedOn: DateTime
        revisionDeletedOn: DateTime
        revisionRestoredOn: DateTime
        revisionFirstPublishedOn: DateTime
        revisionLastPublishedOn: DateTime
        revisionCreatedBy: CmsIdentityInput
        revisionModifiedBy: CmsIdentityInput
        revisionSavedBy: CmsIdentityInput
        revisionDeletedBy: CmsIdentityInput
        revisionRestoredBy: CmsIdentityInput
        revisionFirstPublishedBy: CmsIdentityInput
        revisionLastPublishedBy: CmsIdentityInput

        wbyAco_location: WbyAcoLocationInput

        title: String
        slug: String
    }

    input CategoryApiNameWhichIsABitDifferentThanModelIdGetWhereInput {
        id: ID
        entryId: String
        title: String
        slug: String
    }

    input CategoryApiNameWhichIsABitDifferentThanModelIdListWhereInput {
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
        modifiedOn: DateTime
        modifiedOn_gt: DateTime
        modifiedOn_gte: DateTime
        modifiedOn_lt: DateTime
        modifiedOn_lte: DateTime
        modifiedOn_between: [DateTime!]
        modifiedOn_not_between: [DateTime!]
        savedOn: DateTime
        savedOn_gt: DateTime
        savedOn_gte: DateTime
        savedOn_lt: DateTime
        savedOn_lte: DateTime
        savedOn_between: [DateTime!]
        savedOn_not_between: [DateTime!]
        deletedOn: DateTime
        deletedOn_gt: DateTime
        deletedOn_gte: DateTime
        deletedOn_lt: DateTime
        deletedOn_lte: DateTime
        deletedOn_between: [DateTime!]
        deletedOn_not_between: [DateTime!]
        restoredOn: DateTime
        restoredOn_gt: DateTime
        restoredOn_gte: DateTime
        restoredOn_lt: DateTime
        restoredOn_lte: DateTime
        restoredOn_between: [DateTime!]
        restoredOn_not_between: [DateTime!]
        firstPublishedOn: DateTime
        firstPublishedOn_gt: DateTime
        firstPublishedOn_gte: DateTime
        firstPublishedOn_lt: DateTime
        firstPublishedOn_lte: DateTime
        firstPublishedOn_between: [DateTime!]
        firstPublishedOn_not_between: [DateTime!]
        lastPublishedOn: DateTime
        lastPublishedOn_gt: DateTime
        lastPublishedOn_gte: DateTime
        lastPublishedOn_lt: DateTime
        lastPublishedOn_lte: DateTime
        lastPublishedOn_between: [DateTime!]
        lastPublishedOn_not_between: [DateTime!]
        createdBy: ID
        createdBy_not: ID
        createdBy_in: [ID!]
        createdBy_not_in: [ID!]
        modifiedBy: ID
        modifiedBy_not: ID
        modifiedBy_in: [ID!]
        modifiedBy_not_in: [ID!]
        savedBy: ID
        savedBy_not: ID
        savedBy_in: [ID!]
        savedBy_not_in: [ID!]
        deletedBy: ID
        deletedBy_not: ID
        deletedBy_in: [ID!]
        deletedBy_not_in: [ID!]
        restoredBy: ID
        restoredBy_not: ID
        restoredBy_in: [ID!]
        restoredBy_not_in: [ID!]
        firstPublishedBy: ID
        firstPublishedBy_not: ID
        firstPublishedBy_in: [ID!]
        firstPublishedBy_not_in: [ID!]
        lastPublishedBy: ID
        lastPublishedBy_not: ID
        lastPublishedBy_in: [ID!]
        lastPublishedBy_not_in: [ID!]
        revisionCreatedOn: DateTime
        revisionCreatedOn_gt: DateTime
        revisionCreatedOn_gte: DateTime
        revisionCreatedOn_lt: DateTime
        revisionCreatedOn_lte: DateTime
        revisionCreatedOn_between: [DateTime!]
        revisionCreatedOn_not_between: [DateTime!]
        revisionModifiedOn: DateTime
        revisionModifiedOn_gt: DateTime
        revisionModifiedOn_gte: DateTime
        revisionModifiedOn_lt: DateTime
        revisionModifiedOn_lte: DateTime
        revisionModifiedOn_between: [DateTime!]
        revisionModifiedOn_not_between: [DateTime!]
        revisionSavedOn: DateTime
        revisionSavedOn_gt: DateTime
        revisionSavedOn_gte: DateTime
        revisionSavedOn_lt: DateTime
        revisionSavedOn_lte: DateTime
        revisionSavedOn_between: [DateTime!]
        revisionSavedOn_not_between: [DateTime!]
        revisionDeletedOn: DateTime
        revisionDeletedOn_gt: DateTime
        revisionDeletedOn_gte: DateTime
        revisionDeletedOn_lt: DateTime
        revisionDeletedOn_lte: DateTime
        revisionDeletedOn_between: [DateTime!]
        revisionDeletedOn_not_between: [DateTime!]
        revisionRestoredOn: DateTime
        revisionRestoredOn_gt: DateTime
        revisionRestoredOn_gte: DateTime
        revisionRestoredOn_lt: DateTime
        revisionRestoredOn_lte: DateTime
        revisionRestoredOn_between: [DateTime!]
        revisionRestoredOn_not_between: [DateTime!]
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
        revisionModifiedBy: ID
        revisionModifiedBy_not: ID
        revisionModifiedBy_in: [ID!]
        revisionModifiedBy_not_in: [ID!]
        revisionSavedBy: ID
        revisionSavedBy_not: ID
        revisionSavedBy_in: [ID!]
        revisionSavedBy_not_in: [ID!]
        revisionDeletedBy: ID
        revisionDeletedBy_not: ID
        revisionDeletedBy_in: [ID!]
        revisionDeletedBy_not_in: [ID!]
        revisionRestoredBy: ID
        revisionRestoredBy_not: ID
        revisionRestoredBy_in: [ID!]
        revisionRestoredBy_not_in: [ID!]
        revisionFirstPublishedBy: ID
        revisionFirstPublishedBy_not: ID
        revisionFirstPublishedBy_in: [ID!]
        revisionFirstPublishedBy_not_in: [ID!]
        revisionLastPublishedBy: ID
        revisionLastPublishedBy_not: ID
        revisionLastPublishedBy_in: [ID!]
        revisionLastPublishedBy_not_in: [ID!]
        status: String
        status_not: String
        status_in: [String!]
        status_not_in: [String!]

        title: String
        title_not: String
        title_in: [String]
        title_not_in: [String]
        title_contains: String
        title_not_contains: String
        title_startsWith: String
        title_not_startsWith: String

        slug: String
        slug_not: String
        slug_in: [String]
        slug_not_in: [String]
        slug_contains: String
        slug_not_contains: String
        slug_startsWith: String
        slug_not_startsWith: String

        AND: [CategoryApiNameWhichIsABitDifferentThanModelIdListWhereInput!]
        OR: [CategoryApiNameWhichIsABitDifferentThanModelIdListWhereInput!]
    }

    type CategoryApiNameWhichIsABitDifferentThanModelIdResponse {
        data: CategoryApiNameWhichIsABitDifferentThanModelId
        error: CmsError
    }

    type CategoryApiNameWhichIsABitDifferentThanModelIdMoveResponse {
        data: Boolean
        error: CmsError
    }

    type CategoryApiNameWhichIsABitDifferentThanModelIdArrayResponse {
        data: [CategoryApiNameWhichIsABitDifferentThanModelId]
        error: CmsError
    }

    type CategoryApiNameWhichIsABitDifferentThanModelIdListResponse {
        data: [CategoryApiNameWhichIsABitDifferentThanModelId]
        meta: CmsListMeta
        error: CmsError
    }

    enum CategoryApiNameWhichIsABitDifferentThanModelIdListSorter {
        id_ASC
        id_DESC
        createdOn_ASC
        createdOn_DESC
        modifiedOn_ASC
        modifiedOn_DESC
        savedOn_ASC
        savedOn_DESC
        deletedOn_ASC
        deletedOn_DESC
        restoredOn_ASC
        restoredOn_DESC
        firstPublishedOn_ASC
        firstPublishedOn_DESC
        lastPublishedOn_ASC
        lastPublishedOn_DESC
        revisionCreatedOn_ASC
        revisionCreatedOn_DESC
        revisionModifiedOn_ASC
        revisionModifiedOn_DESC
        revisionSavedOn_ASC
        revisionSavedOn_DESC
        revisionDeletedOn_ASC
        revisionDeletedOn_DESC
        revisionRestoredOn_ASC
        revisionRestoredOn_DESC
        revisionFirstPublishedOn_ASC
        revisionFirstPublishedOn_DESC
        revisionLastPublishedOn_ASC
        revisionLastPublishedOn_DESC
        title_ASC
        title_DESC
        slug_ASC
        slug_DESC
    }

    extend type Query {
        getCategoryApiNameWhichIsABitDifferentThanModelId(
            revision: ID
            entryId: ID
            status: CmsEntryStatusType
        ): CategoryApiNameWhichIsABitDifferentThanModelIdResponse

        getCategoryApiNameWhichIsABitDifferentThanModelIdRevisions(
            id: ID!
        ): CategoryApiNameWhichIsABitDifferentThanModelIdArrayResponse

        getCategoriesApiModelByIds(
            revisions: [ID!]!
        ): CategoryApiNameWhichIsABitDifferentThanModelIdArrayResponse

        listCategoriesApiModel(
            where: CategoryApiNameWhichIsABitDifferentThanModelIdListWhereInput
            sort: [CategoryApiNameWhichIsABitDifferentThanModelIdListSorter]
            limit: Int
            after: String
            search: String
        ): CategoryApiNameWhichIsABitDifferentThanModelIdListResponse

        listDeletedCategoriesApiModel(
            where: CategoryApiNameWhichIsABitDifferentThanModelIdListWhereInput
            sort: [CategoryApiNameWhichIsABitDifferentThanModelIdListSorter]
            limit: Int
            after: String
            search: String
        ): CategoryApiNameWhichIsABitDifferentThanModelIdListResponse
    }

    extend type Mutation {
        createCategoryApiNameWhichIsABitDifferentThanModelId(
            data: CategoryApiNameWhichIsABitDifferentThanModelIdInput!
            options: CreateCmsEntryOptionsInput
        ): CategoryApiNameWhichIsABitDifferentThanModelIdResponse

        createCategoryApiNameWhichIsABitDifferentThanModelIdFrom(
            revision: ID!
            data: CategoryApiNameWhichIsABitDifferentThanModelIdInput
            options: CreateRevisionCmsEntryOptionsInput
        ): CategoryApiNameWhichIsABitDifferentThanModelIdResponse

        updateCategoryApiNameWhichIsABitDifferentThanModelId(
            revision: ID!
            data: CategoryApiNameWhichIsABitDifferentThanModelIdInput!
            options: UpdateCmsEntryOptionsInput
        ): CategoryApiNameWhichIsABitDifferentThanModelIdResponse

        validateCategoryApiNameWhichIsABitDifferentThanModelId(
            revision: ID
            data: CategoryApiNameWhichIsABitDifferentThanModelIdInput!
        ): CmsEntryValidationResponse!

        moveCategoryApiNameWhichIsABitDifferentThanModelId(
            revision: ID!
            folderId: ID!
        ): CategoryApiNameWhichIsABitDifferentThanModelIdMoveResponse

        deleteCategoryApiNameWhichIsABitDifferentThanModelId(
            revision: ID!
            options: CmsDeleteEntryOptions
        ): CmsDeleteResponse

        restoreCategoryApiNameWhichIsABitDifferentThanModelIdFromBin(
            revision: ID!
        ): CategoryApiNameWhichIsABitDifferentThanModelIdResponse

        deleteMultipleCategoriesApiModel(entries: [ID!]!): CmsDeleteMultipleResponse!

        publishCategoryApiNameWhichIsABitDifferentThanModelId(
            revision: ID!
        ): CategoryApiNameWhichIsABitDifferentThanModelIdResponse

        republishCategoryApiNameWhichIsABitDifferentThanModelId(
            revision: ID!
        ): CategoryApiNameWhichIsABitDifferentThanModelIdResponse

        unpublishCategoryApiNameWhichIsABitDifferentThanModelId(
            revision: ID!
        ): CategoryApiNameWhichIsABitDifferentThanModelIdResponse
    }
`;
