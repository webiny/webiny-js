export default /* GraphQL */ `
    """
    Page
    """
    type Page {
        id: ID!
        entryId: String!
        createdOn: DateTime!
        savedOn: DateTime!
        createdBy: CmsCreatedBy!
        ownedBy: CmsOwnedBy!
        meta: PageMeta
        content: [Page_Content!]
        header: Page_Header
        objective: Page_Objective
    }

    type PageMeta {
        modelId: String
        version: Int
        locked: Boolean
        publishedOn: DateTime
        status: String
        """
        CAUTION: this field is resolved by making an extra query to DB.
        RECOMMENDATION: Use it only with "get" queries (avoid in "list")
        """
        revisions: [Page]
        title: String
        """
        Custom meta data stored in the root of the entry object.
        """
        data: JSON
    }

    union Page_Content = Page_Content_Hero | Page_Content_SimpleText | Page_Content_Objecting

    type Page_Content_Hero {
        title: String
    }

    type Page_Content_SimpleText {
        text: String
    }

    type Page_Content_Objecting_NestedObject_ObjectNestedObject {
        nestedObjectNestedTitle: String
    }
    input Page_Content_Objecting_NestedObject_ObjectNestedObjectWhereInput {
        nestedObjectNestedTitle: String
        nestedObjectNestedTitle_not: String
        nestedObjectNestedTitle_in: [String]
        nestedObjectNestedTitle_not_in: [String]
        nestedObjectNestedTitle_contains: String
        nestedObjectNestedTitle_not_contains: String
    }

    type Page_Content_Objecting_NestedObject {
        objectTitle: String
        objectNestedObject: [Page_Content_Objecting_NestedObject_ObjectNestedObject!]
    }
    input Page_Content_Objecting_NestedObjectWhereInput {
        objectTitle: String
        objectTitle_not: String
        objectTitle_in: [String]
        objectTitle_not_in: [String]
        objectTitle_contains: String
        objectTitle_not_contains: String

        objectNestedObject: Page_Content_Objecting_NestedObject_ObjectNestedObjectWhereInput
    }

    type Page_Content_Objecting {
        nestedObject: Page_Content_Objecting_NestedObject
    }

    extend type Page_Content_Hero {
        _templateId: ID!
    }

    extend type Page_Content_SimpleText {
        _templateId: ID!
    }

    extend type Page_Content_Objecting {
        _templateId: ID!
    }

    union Page_Header = Page_Header_TextHeader | Page_Header_ImageHeader

    type Page_Header_TextHeader {
        title: String
    }

    type Page_Header_ImageHeader {
        title: String
        image: String
    }

    extend type Page_Header_TextHeader {
        _templateId: ID!
    }

    extend type Page_Header_ImageHeader {
        _templateId: ID!
    }

    union Page_Objective = Page_Objective_Objecting

    type Page_Objective_Objecting_NestedObject_ObjectNestedObject {
        nestedObjectNestedTitle: String
    }
    input Page_Objective_Objecting_NestedObject_ObjectNestedObjectWhereInput {
        nestedObjectNestedTitle: String
        nestedObjectNestedTitle_not: String
        nestedObjectNestedTitle_in: [String]
        nestedObjectNestedTitle_not_in: [String]
        nestedObjectNestedTitle_contains: String
        nestedObjectNestedTitle_not_contains: String
    }

    type Page_Objective_Objecting_NestedObject {
        objectTitle: String
        objectBody: JSON
        objectNestedObject: [Page_Objective_Objecting_NestedObject_ObjectNestedObject!]
    }
    input Page_Objective_Objecting_NestedObjectWhereInput {
        objectTitle: String
        objectTitle_not: String
        objectTitle_in: [String]
        objectTitle_not_in: [String]
        objectTitle_contains: String
        objectTitle_not_contains: String

        objectNestedObject: Page_Objective_Objecting_NestedObject_ObjectNestedObjectWhereInput
    }

    type Page_Objective_Objecting {
        nestedObject: Page_Objective_Objecting_NestedObject
    }

    extend type Page_Objective_Objecting {
        _templateId: ID!
    }

    input Page_Content_HeroInput {
        title: String!
    }

    input Page_Content_SimpleTextInput {
        text: String
    }

    input Page_Content_Objecting_NestedObject_ObjectNestedObjectInput {
        nestedObjectNestedTitle: String
    }

    input Page_Content_Objecting_NestedObjectInput {
        objectTitle: String
        objectNestedObject: [Page_Content_Objecting_NestedObject_ObjectNestedObjectInput!]
    }

    input Page_Content_ObjectingInput {
        nestedObject: Page_Content_Objecting_NestedObjectInput
    }

    input Page_ContentInput {
        Hero: Page_Content_HeroInput
        SimpleText: Page_Content_SimpleTextInput
        Objecting: Page_Content_ObjectingInput
    }

    input Page_Header_TextHeaderInput {
        title: String
    }

    input Page_Header_ImageHeaderInput {
        title: String
        image: String
    }

    input Page_HeaderInput {
        TextHeader: Page_Header_TextHeaderInput
        ImageHeader: Page_Header_ImageHeaderInput
    }

    input Page_Objective_Objecting_NestedObject_ObjectNestedObjectInput {
        nestedObjectNestedTitle: String
    }

    input Page_Objective_Objecting_NestedObjectInput {
        objectTitle: String
        objectBody: JSON
        objectNestedObject: [Page_Objective_Objecting_NestedObject_ObjectNestedObjectInput!]
    }

    input Page_Objective_ObjectingInput {
        nestedObject: Page_Objective_Objecting_NestedObjectInput
    }

    input Page_ObjectiveInput {
        Objecting: Page_Objective_ObjectingInput
    }

    input PageInput {
        id: ID
        content: [Page_ContentInput]
        header: Page_HeaderInput
        objective: Page_ObjectiveInput
    }

    input PageGetWhereInput {
        id: ID
        entryId: String
    }

    input PageListWhereInput {
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
        AND: [PageListWhereInput!]
        OR: [PageListWhereInput!]
    }

    type PageResponse {
        data: Page
        error: CmsError
    }

    type PageArrayResponse {
        data: [Page]
        error: CmsError
    }

    type PageListResponse {
        data: [Page]
        meta: CmsListMeta
        error: CmsError
    }

    enum PageListSorter {
        id_ASC
        id_DESC
        savedOn_ASC
        savedOn_DESC
        createdOn_ASC
        createdOn_DESC
    }

    extend type Query {
        getPage(revision: ID, entryId: ID, status: CmsEntryStatusType): PageResponse

        getPageRevisions(id: ID!): PageArrayResponse

        getPagesByIds(revisions: [ID!]!): PageArrayResponse

        listPages(
            where: PageListWhereInput
            sort: [PageListSorter]
            limit: Int
            after: String
        ): PageListResponse
    }

    extend type Mutation {
        createPage(data: PageInput!): PageResponse

        createPageFrom(revision: ID!, data: PageInput): PageResponse

        updatePage(revision: ID!, data: PageInput!): PageResponse

        deletePage(revision: ID!): CmsDeleteResponse

        publishPage(revision: ID!): PageResponse

        republishPage(revision: ID!): PageResponse

        unpublishPage(revision: ID!): PageResponse
    }
`;
