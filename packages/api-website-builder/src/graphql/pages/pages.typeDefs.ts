export const pagesTypeDefs = /* GraphQL */ `
    type WbPage {
        id: ID!
        entryId: String!
        wbyAco_location: WbLocation
        status: String!
        version: Number!
        locked: Boolean!
        createdOn: DateTime
        modifiedOn: DateTime
        savedOn: DateTime
        deletedOn: DateTime
        restoredOn: DateTime
        firstPublishedOn: DateTime
        lastPublishedOn: DateTime
        createdBy: WbIdentity
        modifiedBy: WbIdentity
        savedBy: WbIdentity
        deletedBy: WbIdentity
        restoredBy: WbIdentity
        firstPublishedBy: WbIdentity
        lastPublishedBy: WbIdentity
        properties: JSON
        metadata: JSON
        bindings: JSON
        elements: JSON
        extensions: JSON
    }

    input WbPageCreateInput {
        wbyAco_location: WbLocationInput
        properties: JSON
        metadata: JSON
        bindings: JSON
        elements: JSON
        extensions: JSON
    }

    input WbPageUpdateInput {
        properties: JSON
        metadata: JSON
        bindings: JSON
        elements: JSON
        extensions: JSON
    }

    input WbPagesListWhereInput {
        wbyAco_location: WbLocationWhereInput
        latest: Boolean
        published: Boolean
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
        status: String
        status_not: String
        status_in: [String!]
        status_not_in: [String!]
        AND: [WbPagesListWhereInput!]
        OR: [WbPagesListWhereInput!]
    }

    type WbSettings {
        previewDomain: String!
    }

    type WbPageResponse {
        data: WbPage
        error: WbError
    }

    type WbSettingsResponse {
        data: WbSettings
        error: WbError
    }

    type WbIntegrationsResponse {
        data: JSON!
        error: WbError
    }

    input WbSettingsInput {
        previewDomain: String!
    }

    type WbPagesListResponse {
        data: [WbPage]
        error: WbError
        meta: WbMeta
    }

    type WbPageModelResponse {
        data: JSON
        error: WbError
    }

    enum WbPageListSorter {
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
    }

    type WbPageRevision {
        id: ID!
        entryId: ID!
        version: Int!
        title: String!
        status: String!
        locked: Boolean!
        savedOn: DateTime!
    }

    type WbPageRevisionsResponse {
        data: [WbPageRevision!]
        error: WbError
    }

    extend type WbQuery {
        getPageModel: WbPageModelResponse
        getPageByPath(path: String!): WbPageResponse
        getPageById(id: ID!): WbPageResponse
        getPageRevisions(entryId: ID!): WbPageRevisionsResponse
        listPages(
            where: WbPagesListWhereInput
            limit: Int
            after: String
            sort: [WbPageListSorter]
            search: String
        ): WbPagesListResponse
        getSettings: WbSettingsResponse
        getIntegrations: WbIntegrationsResponse
    }

    extend type WbMutation {
        createPage(data: WbPageCreateInput!): WbPageResponse
        updatePage(id: ID!, data: WbPageUpdateInput!): WbPageResponse
        publishPage(id: ID!): WbPageResponse
        unpublishPage(id: ID!): WbPageResponse
        duplicatePage(id: ID!): WbPageResponse
        movePage(id: ID!, folderId: ID!): WbBooleanResponse
        createPageRevisionFrom(id: ID!): WbPageResponse
        deletePage(id: ID!): WbBooleanResponse
        updateSettings(data: WbSettingsInput!): BooleanResponse
        updateIntegrations(data: JSON!): BooleanResponse
    }
`;
