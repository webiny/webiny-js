export default /* GraphQL */ `
    """
    Page
    """
    type PageModelApiName {
        id: ID!
        entryId: String!

        createdOn: DateTime!
        modifiedOn: DateTime
        savedOn: DateTime!
        deletedOn: DateTime
        firstPublishedOn: DateTime
        lastPublishedOn: DateTime
        createdBy: CmsIdentity!
        modifiedBy: CmsIdentity
        savedBy: CmsIdentity!
        deletedBy: CmsIdentity
        firstPublishedBy: CmsIdentity
        lastPublishedBy: CmsIdentity
        revisionCreatedOn: DateTime!
        revisionModifiedOn: DateTime
        revisionSavedOn: DateTime!
        revisionDeletedOn: DateTime
        revisionFirstPublishedOn: DateTime
        revisionLastPublishedOn: DateTime
        revisionCreatedBy: CmsIdentity!
        revisionModifiedBy: CmsIdentity
        revisionSavedBy: CmsIdentity!
        revisionDeletedBy: CmsIdentity
        revisionFirstPublishedBy: CmsIdentity
        revisionLastPublishedBy: CmsIdentity

        meta: PageModelApiNameMeta
        content: [PageModelApiName_Content!]
        header: PageModelApiName_Header
        objective: PageModelApiName_Objective
        reference: PageModelApiName_Reference
        references1: PageModelApiName_References1
        references2: [PageModelApiName_References2!]
        ghostObject: PageModelApiName_GhostObject
        # Advanced Content Organization - make required in 5.38.0
        wbyAco_location: WbyAcoLocation
    }

    type PageModelApiNameMeta {
        modelId: String
        version: Int
        locked: Boolean

        status: String
        """
        CAUTION: this field is resolved by making an extra query to DB.
        RECOMMENDATION: Use it only with "get" queries (avoid in "list")
        """
        revisions: [PageModelApiName!]
        title: String
        description: String
        image: String
        """
        Custom meta data stored in the root of the entry object.
        """
        data: JSON
    }

    union PageModelApiName_Content =
          PageModelApiName_Content_Hero
        | PageModelApiName_Content_SimpleText
        | PageModelApiName_Content_Objecting
        | PageModelApiName_Content_Author

    type PageModelApiName_Content_Hero {
        title: String
    }

    type PageModelApiName_Content_SimpleText {
        text: String
    }

    type PageModelApiName_Content_Objecting_NestedObject_ObjectNestedObject {
        nestedObjectNestedTitle: String
    }

    input PageModelApiName_Content_Objecting_NestedObject_ObjectNestedObjectWhereInput {
        nestedObjectNestedTitle: String
        nestedObjectNestedTitle_not: String
        nestedObjectNestedTitle_in: [String]
        nestedObjectNestedTitle_not_in: [String]
        nestedObjectNestedTitle_contains: String
        nestedObjectNestedTitle_not_contains: String
        nestedObjectNestedTitle_startsWith: String
        nestedObjectNestedTitle_not_startsWith: String
    }

    type PageModelApiName_Content_Objecting_NestedObject {
        objectTitle: String
        objectNestedObject: [PageModelApiName_Content_Objecting_NestedObject_ObjectNestedObject!]
    }

    input PageModelApiName_Content_Objecting_NestedObjectWhereInput {
        objectTitle: String
        objectTitle_not: String
        objectTitle_in: [String]
        objectTitle_not_in: [String]
        objectTitle_contains: String
        objectTitle_not_contains: String
        objectTitle_startsWith: String
        objectTitle_not_startsWith: String

        objectNestedObject: PageModelApiName_Content_Objecting_NestedObject_ObjectNestedObjectWhereInput
    }

    union PageModelApiName_Content_Objecting_DynamicZone =
          PageModelApiName_Content_Objecting_DynamicZone_SuperNestedObject

    type PageModelApiName_Content_Objecting_DynamicZone_SuperNestedObject {
        authors: [RefField!]
    }

    extend type PageModelApiName_Content_Objecting_DynamicZone_SuperNestedObject {
        _templateId: ID!
    }

    type PageModelApiName_Content_Objecting {
        nestedObject: PageModelApiName_Content_Objecting_NestedObject
        dynamicZone: PageModelApiName_Content_Objecting_DynamicZone
    }

    type PageModelApiName_Content_Author {
        author: RefField
        authors: [RefField!]
    }

    extend type PageModelApiName_Content_Hero {
        _templateId: ID!
    }

    extend type PageModelApiName_Content_SimpleText {
        _templateId: ID!
    }

    extend type PageModelApiName_Content_Objecting {
        _templateId: ID!
    }

    extend type PageModelApiName_Content_Author {
        _templateId: ID!
    }

    union PageModelApiName_Header =
          PageModelApiName_Header_TextHeader
        | PageModelApiName_Header_ImageHeader

    type PageModelApiName_Header_TextHeader {
        title: String
    }

    type PageModelApiName_Header_ImageHeader {
        title: String
        image: String
    }

    extend type PageModelApiName_Header_TextHeader {
        _templateId: ID!
    }

    extend type PageModelApiName_Header_ImageHeader {
        _templateId: ID!
    }

    union PageModelApiName_Objective = PageModelApiName_Objective_Objecting

    type PageModelApiName_Objective_Objecting_NestedObject_ObjectNestedObject {
        nestedObjectNestedTitle: String
    }

    input PageModelApiName_Objective_Objecting_NestedObject_ObjectNestedObjectWhereInput {
        nestedObjectNestedTitle: String
        nestedObjectNestedTitle_not: String
        nestedObjectNestedTitle_in: [String]
        nestedObjectNestedTitle_not_in: [String]
        nestedObjectNestedTitle_contains: String
        nestedObjectNestedTitle_not_contains: String
        nestedObjectNestedTitle_startsWith: String
        nestedObjectNestedTitle_not_startsWith: String
    }

    type PageModelApiName_Objective_Objecting_NestedObject {
        objectTitle: String
        objectBody: JSON
        objectNestedObject: [PageModelApiName_Objective_Objecting_NestedObject_ObjectNestedObject!]
    }

    input PageModelApiName_Objective_Objecting_NestedObjectWhereInput {
        objectTitle: String
        objectTitle_not: String
        objectTitle_in: [String]
        objectTitle_not_in: [String]
        objectTitle_contains: String
        objectTitle_not_contains: String
        objectTitle_startsWith: String
        objectTitle_not_startsWith: String

        objectNestedObject: PageModelApiName_Objective_Objecting_NestedObject_ObjectNestedObjectWhereInput
    }

    type PageModelApiName_Objective_Objecting {
        nestedObject: PageModelApiName_Objective_Objecting_NestedObject
    }

    extend type PageModelApiName_Objective_Objecting {
        _templateId: ID!
    }

    union PageModelApiName_Reference = PageModelApiName_Reference_Author

    type PageModelApiName_Reference_Author {
        author: RefField
    }

    extend type PageModelApiName_Reference_Author {
        _templateId: ID!
    }

    union PageModelApiName_References1 = PageModelApiName_References1_Authors

    type PageModelApiName_References1_Authors {
        authors: [RefField!]
    }

    extend type PageModelApiName_References1_Authors {
        _templateId: ID!
    }

    union PageModelApiName_References2 = PageModelApiName_References2_Author

    type PageModelApiName_References2_Author {
        author: RefField
    }

    extend type PageModelApiName_References2_Author {
        _templateId: ID!
    }

    type PageModelApiName_GhostObject {
        _empty: String
    }

    input PageModelApiName_GhostObjectWhereInput {
        _empty: String
    }

    input PageModelApiName_Content_HeroInput {
        title: String
    }

    input PageModelApiName_Content_SimpleTextInput {
        text: String
    }

    input PageModelApiName_Content_Objecting_NestedObject_ObjectNestedObjectInput {
        nestedObjectNestedTitle: String
    }

    input PageModelApiName_Content_Objecting_NestedObjectInput {
        objectTitle: String
        objectNestedObject: [PageModelApiName_Content_Objecting_NestedObject_ObjectNestedObjectInput!]
    }

    input PageModelApiName_Content_Objecting_DynamicZone_SuperNestedObjectInput {
        authors: [RefFieldInput]
    }

    input PageModelApiName_Content_Objecting_DynamicZoneInput {
        SuperNestedObject: PageModelApiName_Content_Objecting_DynamicZone_SuperNestedObjectInput
    }

    input PageModelApiName_Content_ObjectingInput {
        nestedObject: PageModelApiName_Content_Objecting_NestedObjectInput
        dynamicZone: PageModelApiName_Content_Objecting_DynamicZoneInput
    }

    input PageModelApiName_Content_AuthorInput {
        author: RefFieldInput
        authors: [RefFieldInput!]
    }

    input PageModelApiName_ContentInput {
        Hero: PageModelApiName_Content_HeroInput
        SimpleText: PageModelApiName_Content_SimpleTextInput
        Objecting: PageModelApiName_Content_ObjectingInput
        Author: PageModelApiName_Content_AuthorInput
    }

    input PageModelApiName_Header_TextHeaderInput {
        title: String
    }

    input PageModelApiName_Header_ImageHeaderInput {
        title: String
        image: String
    }

    input PageModelApiName_HeaderInput {
        TextHeader: PageModelApiName_Header_TextHeaderInput
        ImageHeader: PageModelApiName_Header_ImageHeaderInput
    }

    input PageModelApiName_Objective_Objecting_NestedObject_ObjectNestedObjectInput {
        nestedObjectNestedTitle: String
    }

    input PageModelApiName_Objective_Objecting_NestedObjectInput {
        objectTitle: String
        objectBody: JSON
        objectNestedObject: [PageModelApiName_Objective_Objecting_NestedObject_ObjectNestedObjectInput!]
    }

    input PageModelApiName_Objective_ObjectingInput {
        nestedObject: PageModelApiName_Objective_Objecting_NestedObjectInput
    }

    input PageModelApiName_ObjectiveInput {
        Objecting: PageModelApiName_Objective_ObjectingInput
    }

    input PageModelApiName_Reference_AuthorInput {
        author: RefFieldInput
    }

    input PageModelApiName_ReferenceInput {
        Author: PageModelApiName_Reference_AuthorInput
    }

    input PageModelApiName_References1_AuthorsInput {
        authors: [RefFieldInput]
    }

    input PageModelApiName_References1Input {
        Authors: PageModelApiName_References1_AuthorsInput
    }

    input PageModelApiName_References2_AuthorInput {
        author: RefFieldInput
    }

    input PageModelApiName_References2Input {
        Author: PageModelApiName_References2_AuthorInput
    }

    input PageModelApiName_GhostObjectInput {
        _empty: String
    }

    input PageModelApiNameInput {
        id: ID

        # Set status of the entry.
        status: String

        createdOn: DateTime
        modifiedOn: DateTime
        savedOn: DateTime
        deletedOn: DateTime
        firstPublishedOn: DateTime
        lastPublishedOn: DateTime
        createdBy: CmsIdentityInput
        modifiedBy: CmsIdentityInput
        savedBy: CmsIdentityInput
        deletedBy: CmsIdentityInput
        firstPublishedBy: CmsIdentityInput
        lastPublishedBy: CmsIdentityInput
        revisionCreatedOn: DateTime
        revisionModifiedOn: DateTime
        revisionSavedOn: DateTime
        revisionDeletedOn: DateTime
        revisionFirstPublishedOn: DateTime
        revisionLastPublishedOn: DateTime
        revisionCreatedBy: CmsIdentityInput
        revisionModifiedBy: CmsIdentityInput
        revisionSavedBy: CmsIdentityInput
        revisionDeletedBy: CmsIdentityInput
        revisionFirstPublishedBy: CmsIdentityInput
        revisionLastPublishedBy: CmsIdentityInput

        wbyAco_location: WbyAcoLocationInput

        content: [PageModelApiName_ContentInput]
        header: PageModelApiName_HeaderInput
        objective: PageModelApiName_ObjectiveInput
        reference: PageModelApiName_ReferenceInput
        references1: PageModelApiName_References1Input
        references2: [PageModelApiName_References2Input]
        ghostObject: PageModelApiName_GhostObjectInput
    }

    input PageModelApiNameGetWhereInput {
        id: ID
        entryId: String
    }

    input PageModelApiNameListWhereInput {
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
        ghostObject: PageModelApiName_GhostObjectWhereInput
        AND: [PageModelApiNameListWhereInput!]
        OR: [PageModelApiNameListWhereInput!]
    }

    type PageModelApiNameResponse {
        data: PageModelApiName
        error: CmsError
    }

    type PageModelApiNameMoveResponse {
        data: Boolean
        error: CmsError
    }

    type PageModelApiNameArrayResponse {
        data: [PageModelApiName]
        error: CmsError
    }

    type PageModelApiNameListResponse {
        data: [PageModelApiName]
        meta: CmsListMeta
        error: CmsError
    }

    enum PageModelApiNameListSorter {
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
        revisionFirstPublishedOn_ASC
        revisionFirstPublishedOn_DESC
        revisionLastPublishedOn_ASC
        revisionLastPublishedOn_DESC
    }

    extend type Query {
        getPageModelApiName(
            revision: ID
            entryId: ID
            status: CmsEntryStatusType
            deleted: Boolean
        ): PageModelApiNameResponse

        getPageModelApiNameRevisions(id: ID!, deleted: Boolean): PageModelApiNameArrayResponse

        getPagesModelApiNameByIds(
            revisions: [ID!]!
            deleted: Boolean
        ): PageModelApiNameArrayResponse

        listPagesModelApiName(
            where: PageModelApiNameListWhereInput
            sort: [PageModelApiNameListSorter]
            limit: Int
            after: String
            search: String
            deleted: Boolean
        ): PageModelApiNameListResponse
    }

    extend type Mutation {
        createPageModelApiName(
            data: PageModelApiNameInput!
            options: CreateCmsEntryOptionsInput
        ): PageModelApiNameResponse

        createPageModelApiNameFrom(
            revision: ID!
            data: PageModelApiNameInput
            options: CreateRevisionCmsEntryOptionsInput
        ): PageModelApiNameResponse

        updatePageModelApiName(
            revision: ID!
            data: PageModelApiNameInput!
            options: UpdateCmsEntryOptionsInput
        ): PageModelApiNameResponse

        validatePageModelApiName(
            revision: ID
            data: PageModelApiNameInput!
        ): CmsEntryValidationResponse!

        movePageModelApiName(revision: ID!, folderId: ID!): PageModelApiNameMoveResponse

        deletePageModelApiName(revision: ID!, options: CmsDeleteEntryOptions): CmsDeleteResponse

        deleteMultiplePagesModelApiName(entries: [ID!]!): CmsDeleteMultipleResponse!

        publishPageModelApiName(revision: ID!): PageModelApiNameResponse

        republishPageModelApiName(revision: ID!): PageModelApiNameResponse

        unpublishPageModelApiName(revision: ID!): PageModelApiNameResponse
    }
`;
