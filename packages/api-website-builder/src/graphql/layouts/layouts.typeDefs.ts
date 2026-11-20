export const layoutsTypeDefs = /* GraphQL */ `
    type WbLayoutLive {
        version: Int!
    }

    type WbLayout {
        # The revision id, e.g. "abc#0001".
        id: ID!
        entryId: ID!
        # draft | published | unpublished
        status: String!
        version: Int!
        locked: Boolean!
        # The published revision's version, or null when no revision is published.
        live: WbLayoutLive
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

    # A layout delivered for content that isn't a page (e.g. a CMS entry), composed like a page without content.
    type WbComposedLayout {
        # The instance elements of the global components, in the requested language (or else the site's
        # default language, or else "default"), and their bindings merged with the layout's overrides of them.
        elements: JSON!
        bindings: JSON!
        # The layout as published.
        layout: WbLayout!
    }

    type WbComposedLayoutResponse {
        data: WbComposedLayout
        error: WbError
    }

    type WbLayoutUsageModel {
        modelId: String!
        name: String!
    }

    type WbLayoutUsage {
        # Pages (not in the trash) rendered in the layout.
        pages: Int!
        isDefault: Boolean!
        # CMS models whose "layout" setting names the layout's slug.
        models: [WbLayoutUsageModel!]!
    }

    type WbLayoutUsageResponse {
        data: WbLayoutUsage
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
        # The published source layout with the slug, in its published version in "language" or else as the
        # source, composed with the global components of "language". Null when no such layout is published.
        getLayoutBySlug(slug: String!, language: String): WbComposedLayoutResponse
        # What renders with a layout revision: pages, the default layout setting, and CMS models.
        getLayoutUsage(id: ID!): WbLayoutUsageResponse
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
