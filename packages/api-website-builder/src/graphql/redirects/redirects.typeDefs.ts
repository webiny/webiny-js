export const redirectsTypeDefs = /* GraphQL */ `
    type WbRedirect {
        id: ID!
        wbyAco_location: WbLocation
        createdOn: DateTime
        modifiedOn: DateTime
        savedOn: DateTime
        deletedOn: DateTime
        createdBy: WbIdentity
        modifiedBy: WbIdentity
        savedBy: WbIdentity
        deletedBy: WbIdentity
        redirectFrom: String!
        redirectTo: String!
        redirectType: String!
        isEnabled: Boolean!
    }

    input WbRedirectCreateInput {
        wbyAco_location: WbLocationInput!
        redirectFrom: String!
        redirectTo: String!
        redirectType: String!
        isEnabled: Boolean!
    }

    input WbRedirectUpdateInput {
        redirectFrom: String!
        redirectTo: String!
        redirectType: String!
        isEnabled: Boolean!
    }

    input WbRedirectsListWhereInput {
        wbyAco_location: WbLocationWhereInput
        id: ID
        id_not: ID
        id_in: [ID!]
        id_not_in: [ID!]
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
        AND: [WbRedirectsListWhereInput!]
        OR: [WbRedirectsListWhereInput!]
    }

    type WbRedirectResponse {
        data: WbRedirect
        error: WbError
    }

    type WbRedirectsListResponse {
        data: [WbRedirect]
        error: WbError
        meta: WbMeta
    }

    type WbRedirectModelResponse {
        data: JSON
        error: WbError
    }

    enum WbRedirectListSorter {
        id_ASC
        id_DESC
        createdOn_ASC
        createdOn_DESC
        modifiedOn_ASC
        modifiedOn_DESC
        savedOn_ASC
        savedOn_DESC
    }

    extend type WbQuery {
        getRedirectById(id: ID!): WbRedirectResponse
        listRedirects(
            where: WbRedirectsListWhereInput
            limit: Int
            after: String
            sort: [WbRedirectListSorter]
            search: String
        ): WbRedirectsListResponse
    }

    extend type WbMutation {
        createRedirect(data: WbRedirectCreateInput!): WbRedirectResponse
        updateRedirect(id: ID!, data: WbRedirectUpdateInput!): WbRedirectResponse
        moveRedirect(id: ID!, folderId: ID!): WbBooleanResponse
        deleteRedirect(id: ID!): WbBooleanResponse
    }
`;
