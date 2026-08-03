export const themeTypeDefs = /* GraphQL */ `
    type ThemeIdentity {
        id: ID
        displayName: String
        type: String
    }

    type ThemeEntryLive {
        version: Int!
    }

    type Theme {
        id: ID!
        entryId: String!
        status: String!
        version: Int!
        locked: Boolean!
        live: ThemeEntryLive
        createdOn: DateTime
        savedOn: DateTime
        modifiedOn: DateTime
        firstPublishedOn: DateTime
        lastPublishedOn: DateTime
        createdBy: ThemeIdentity
        savedBy: ThemeIdentity
        modifiedBy: ThemeIdentity
        """
        Name and description.
        """
        properties: JSON
        """
        The DTCG draft document. Aliases are unresolved here — read 'resolved' for literals.
        """
        tokens: JSON
        policy: JSON
        settings: JSON
        """
        The frozen snapshot, written at publish. Null on a draft that has never been published.
        """
        resolved: JSON
        metadata: JSON
        extensions: JSON
    }

    type ThemeRevision {
        id: ID!
        entryId: String!
        version: Int!
        name: String
        status: String!
        locked: Boolean!
        savedOn: DateTime
        createdOn: DateTime
        createdBy: ThemeIdentity
        lastPublishedOn: DateTime
    }

    type ActiveThemePointer {
        entryId: String!
        id: ID!
        version: Int!
        activatedOn: DateTime
        activatedBy: ThemeIdentity
    }

    type ActiveThemeResult {
        """
        Null when no theme is active — a supported, permanent state, not an error.
        """
        theme: Theme
        pointer: ActiveThemePointer
    }

    type ThemePublishWarning {
        code: String!
        path: String!
        message: String!
    }

    type PublishThemeResult {
        theme: Theme!
        """
        Advisory contrast and zoom issues that did not block the publish.
        """
        warnings: [ThemePublishWarning!]!
    }

    type ActivateThemeResult {
        theme: Theme!
        pointer: ActiveThemePointer!
        previous: ActiveThemePointer
    }

    type DeactivateThemeResult {
        previous: ActiveThemePointer
    }

    input ThemePropertiesInput {
        name: String
        description: String
    }

    input ThemeCreateInput {
        properties: ThemePropertiesInput!
        tokens: JSON
        policy: JSON
        settings: JSON
        metadata: JSON
        extensions: JSON
    }

    input ThemeUpdateInput {
        properties: ThemePropertiesInput
        tokens: JSON
        policy: JSON
        settings: JSON
        metadata: JSON
        extensions: JSON
    }

    input ThemesListWhereInput {
        id: ID
        id_in: [ID!]
        entryId: String
        entryId_in: [String!]
        status: String
    }

    type ThemeListMeta {
        hasMoreItems: Boolean
        totalCount: Int
        cursor: String
    }

    type ThemeResponse {
        data: Theme
        error: ThemeError
    }

    type ThemeListResponse {
        data: [Theme!]
        meta: ThemeListMeta
        error: ThemeError
    }

    type ThemeRevisionsResponse {
        data: [ThemeRevision!]
        error: ThemeError
    }

    type ActiveThemeResponse {
        data: ActiveThemeResult
        error: ThemeError
    }

    type PublishThemeResponse {
        data: PublishThemeResult
        error: ThemeError
    }

    type ActivateThemeResponse {
        data: ActivateThemeResult
        error: ThemeError
    }

    type DeactivateThemeResponse {
        data: DeactivateThemeResult
        error: ThemeError
    }

    type ThemeBooleanResponse {
        data: Boolean
        error: ThemeError
    }

    extend type ThemeQuery {
        getTheme(id: ID!): ThemeResponse
        listThemes(
            where: ThemesListWhereInput
            sort: [String!]
            limit: Int
            after: String
            search: String
        ): ThemeListResponse
        getThemeRevisions(entryId: String!): ThemeRevisionsResponse
        getActiveTheme: ActiveThemeResponse
    }

    extend type ThemeMutation {
        createTheme(data: ThemeCreateInput!): ThemeResponse
        updateTheme(id: ID!, data: ThemeUpdateInput!): ThemeResponse
        deleteTheme(id: ID!): ThemeBooleanResponse
        createThemeRevisionFrom(id: ID!): ThemeResponse
        publishTheme(id: ID!): PublishThemeResponse
        activateTheme(id: ID!): ActivateThemeResponse
        deactivateTheme: DeactivateThemeResponse
    }
`;
