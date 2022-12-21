export default /* GraphQL */ `
    """
    Article
    """
    type Article {
        id: ID!
        entryId: String!
        createdOn: DateTime!
        savedOn: DateTime!
        createdBy: CmsCreatedBy!
        ownedBy: CmsOwnedBy!
        content: [Article_Content!]!
        header: Article_Header
    }

    union Article_Content = Article_Content_Hero | Article_Content_SimpleText

    type Article_Content_Hero {
        title: String
    }

    type Article_Content_SimpleText {
        text: String
    }

    union Article_Header = Article_Header_TextHeader | Article_Header_ImageHeader

    type Article_Header_TextHeader {
        title: String
    }

    type Article_Header_ImageHeader {
        title: String
        image: String
    }

    input ArticleGetWhereInput {
        id: ID
        entryId: String
    }

    input ArticleListWhereInput {
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

    enum ArticleListSorter {
        id_ASC
        id_DESC
        savedOn_ASC
        savedOn_DESC
        createdOn_ASC
        createdOn_DESC
    }

    type ArticleResponse {
        data: Article
        error: CmsError
    }

    type ArticleListResponse {
        data: [Article]
        meta: CmsListMeta
        error: CmsError
    }

    extend type Query {
        getArticle(where: ArticleGetWhereInput!): ArticleResponse

        listArticles(
            where: ArticleListWhereInput
            sort: [ArticleListSorter]
            limit: Int
            after: String
        ): ArticleListResponse
    }
`;
