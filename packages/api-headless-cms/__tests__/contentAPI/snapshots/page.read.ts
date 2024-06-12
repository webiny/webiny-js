export default /* GraphQL */ `
    """
    Page
    """
    type PageModelApiName {
        id: ID!
        entryId: String!
        modelId: String!

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
        objectBody(format: String): JSON
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

    input PageModelApiNameGetWhereInput {
        id: ID
        entryId: String
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
        ghostObject: PageModelApiName_GhostObjectWhereInput
        AND: [PageModelApiNameListWhereInput!]
        OR: [PageModelApiNameListWhereInput!]
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
