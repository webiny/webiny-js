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

    union Page_Content = Page_Content_Hero | Page_Content_SimpleText

    type Page_Content_Hero {
        title: String
    }

    type Page_Content_SimpleText {
        text: String
    }

    extend type Page_Content_Hero {
        _templateId: ID!
    }
    
    extend type Page_Content_SimpleText {
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

    input Page_Content_HeroInput {
        title: String!
    }

    input Page_Content_SimpleTextInput {
        text: String
    }

    input Page_ContentInput {
        Hero: Page_Content_HeroInput
        SimpleText: Page_Content_SimpleTextInput
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

    input PageInput {
        content: [Page_ContentInput]
        header: Page_HeaderInput
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
