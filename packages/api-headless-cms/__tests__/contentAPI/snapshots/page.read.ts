export default `
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
        content: [Page_Content!]
        header: Page_Header
    }

    union Page_Content = Page_Content_Hero | Page_Content_SimpleText

    type Page_Content_Hero {
        title: String
    }

    type Page_Content_SimpleText {
        text: String
    }

    union Page_Header = Page_Header_TextHeader | Page_Header_ImageHeader

    type Page_Header_TextHeader {
        title: String
    }

    type Page_Header_ImageHeader {
        title: String
        image: String
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
    }

    enum PageListSorter {
        id_ASC
        id_DESC
        savedOn_ASC
        savedOn_DESC
        createdOn_ASC
        createdOn_DESC
    }

    type PageResponse {
        data: Page
        error: CmsError
    }

    type PageListResponse {
        data: [Page]
        meta: CmsListMeta
        error: CmsError
    }

    extend type Query {
        getPage(where: PageGetWhereInput!): PageResponse

        listPages(
            where: PageListWhereInput
            sort: [PageListSorter]
            limit: Int
            after: String
        ): PageListResponse
    }
`;
