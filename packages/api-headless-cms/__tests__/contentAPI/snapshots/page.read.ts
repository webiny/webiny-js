export default /* GraphQL */ `
    """
    Page
    """
    type PageModelApiName {
        id: ID!
        entryId: String!
        modelId: String!

        createdOn: DateTime! @deprecated(reason: "Use 'revisionCreatedOn' or 'entryCreatedOn'.")
        savedOn: DateTime! @deprecated(reason: "Use 'revisionSavedOn' or 'entrySavedOn'.")
        createdBy: CmsIdentity! @deprecated(reason: "Use 'revisionCreatedBy' or 'entryCreatedBy'.")
        ownedBy: CmsIdentity! @deprecated(reason: "Use 'entryCreatedOn'.")

        meta: PageModelApiNameMeta

        content: [PageModelApiName_Content!]
        header: PageModelApiName_Header
        objective: PageModelApiName_Objective
        reference: PageModelApiName_Reference
        references1: PageModelApiName_References1
        references2: [PageModelApiName_References2!]
        ghostObject: PageModelApiName_GhostObject
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
        authors(populate: Boolean = true): [AuthorApiModel!]
    }

    type PageModelApiName_Content_Objecting {
        nestedObject: PageModelApiName_Content_Objecting_NestedObject
        dynamicZone: PageModelApiName_Content_Objecting_DynamicZone
    }

    type PageModelApiName_Content_Author {
        author(populate: Boolean = true): AuthorApiModel
        authors(populate: Boolean = true): [AuthorApiModel!]
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

    union PageModelApiName_Reference = PageModelApiName_Reference_Author

    type PageModelApiName_Reference_Author {
        author(populate: Boolean = true): AuthorApiModel
    }

    union PageModelApiName_References1 = PageModelApiName_References1_Authors

    type PageModelApiName_References1_Authors {
        authors(populate: Boolean = true): [AuthorApiModel!]
    }

    union PageModelApiName_References2 = PageModelApiName_References2_Author

    type PageModelApiName_References2_Author {
        author(populate: Boolean = true): AuthorApiModel
    }

    type PageModelApiName_GhostObject {
        _empty: String
    }

    input PageModelApiName_GhostObjectWhereInput {
        _empty: String
    }

    type PageModelApiNameMeta {
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
    }

    input PageModelApiNameGetWhereInput {
        id: ID
        entryId: String
    }

    input PageModelApiNameListWhereMetaInput {
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

    input PageModelApiNameListWhereInput {
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
        ghostObject: PageModelApiName_GhostObjectWhereInput
        meta: PageModelApiNameListWhereMetaInput
        AND: [PageModelApiNameListWhereInput!]
        OR: [PageModelApiNameListWhereInput!]
    }

    enum PageModelApiNameListSorter {
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
    }

    type PageModelApiNameResponse {
        data: PageModelApiName
        error: CmsError
    }

    type PageModelApiNameListResponse {
        data: [PageModelApiName]
        meta: CmsListMeta
        error: CmsError
    }

    extend type Query {
        getPageModelApiName(where: PageModelApiNameGetWhereInput!): PageModelApiNameResponse

        listPagesModelApiName(
            where: PageModelApiNameListWhereInput
            sort: [PageModelApiNameListSorter]
            limit: Int
            after: String
            search: String
        ): PageModelApiNameListResponse
    }
`;
