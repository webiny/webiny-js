export const layoutsTypeDefs = /* GraphQL */ `
    type WbLayout {
        # The revision id, e.g. "abc#0001".
        id: ID!
        entryId: ID!
        # draft | published | unpublished
        status: String!
        version: Int!
        locked: Boolean!
        # The published revision's version, or null when no revision is published.
        live: CmsEntryLive
        revisionDescription: String
        # { title, slug?, language?, sourceLayout? }: "sourceLayout" is set only on language versions, and "slug"
        # only on source layouts (unique among them).
        properties: JSON!
        metadata: JSON
        elements: JSON!
        bindings: JSON!
        extensions: JSON
        createdOn: DateTime
        savedOn: DateTime
        modifiedOn: DateTime
        createdBy: WbIdentity
        savedBy: WbIdentity
        modifiedBy: WbIdentity
    }

    input WbLayoutCreateInput {
        # "title" is required; "slug" and "language" are optional. A sent "slug" must be free; left out, the
        # first free slug made from the title is used.
        properties: JSON!
        # Leave out elements and bindings to start with the root and the page content placeholder.
        elements: JSON
        bindings: JSON
    }

    input WbLayoutUpdateInput {
        # Merged into the stored properties.
        properties: JSON
        metadata: JSON
        elements: JSON
        bindings: JSON
        extensions: JSON
    }

    type WbLayoutResponse {
        data: WbLayout
        error: WbError
    }

    type WbLayoutListResponse {
        data: [WbLayout!]
        error: WbError
    }

    type WbLayoutSettings {
        # The entry id of the default (published, source) layout new pages get.
        defaultLayout: ID
    }

    type WbLayoutSettingsResponse {
        data: WbLayoutSettings
        error: WbError
    }

    extend type WbPage {
        # The published layout the page is rendered in: of its properties.layout, in the page's language.
        # Delivered pages (getPageById, getPageByPath) come with it composed: its own elements' bindings
        # merged with the page's overrides. With getPageById(raw: true), it is as published.
        layout: WbLayout
    }

    extend type WbQuery {
        # A revision id reads that revision; an entry id reads the latest revision. As stored.
        getLayout(id: ID!): WbLayoutResponse
        # The latest revision of every layout: sources and their language versions.
        listLayouts: WbLayoutListResponse
        getLayoutRevisions(entryId: ID!): WbLayoutListResponse
        # The published version in "language", or else the published source, or else null. As stored.
        getPageLayout(id: ID!, language: String): WbLayoutResponse
        getLayoutSettings: WbLayoutSettingsResponse
    }

    extend type WbMutation {
        createLayout(data: WbLayoutCreateInput!): WbLayoutResponse
        updateLayout(id: ID!, data: WbLayoutUpdateInput!): WbLayoutResponse
        publishLayout(id: ID!): WbLayoutResponse
        unpublishLayout(id: ID!): WbLayoutResponse
        createLayoutRevisionFrom(id: ID!): WbLayoutResponse
        deleteLayoutRevision(id: ID!): WbBooleanResponse
        # Deletes a layout with all its revisions; a source layout also deletes its language versions.
        deleteLayout(id: ID!): WbBooleanResponse
        # Source layouts only: a new draft "{title} (copy)", in the same language, with slug "{slug}-copy"
        # (or "-copy-2", ...).
        duplicateLayout(id: ID!): WbLayoutResponse
        # Source layouts only: a new draft version in "language".
        translateLayout(id: ID!, language: String!): WbLayoutResponse
        # A published source layout; null clears the default.
        setDefaultLayout(id: ID): WbLayoutSettingsResponse
    }
`;
