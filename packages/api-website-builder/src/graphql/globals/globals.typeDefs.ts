export const globalsTypeDefs = /* GraphQL */ `
    type WbGlobalComponent {
        name: String!
        # Code of the language the global is stored in; "default" for pages and layouts without a language.
        language: String!
        elements: JSON!
        bindings: JSON!
    }

    input WbGlobalComponentInput {
        elements: JSON!
        bindings: JSON!
    }

    type WbGlobalComponentResponse {
        data: WbGlobalComponent
        error: WbError
    }

    type WbGlobalComponentListResponse {
        data: [WbGlobalComponent!]
        error: WbError
    }

    # "language" is a language code, or "default" (the same as leaving it out) for pages without a language.
    extend type WbQuery {
        # Exact: there is no fallback to another language.
        getGlobalComponent(name: String!, language: String): WbGlobalComponentResponse
        # With "fallback: true", a global without a record in "language" comes in its record of the site's
        # default language, or else in its "default" record.
        listGlobalComponents(language: String, fallback: Boolean): WbGlobalComponentListResponse
    }

    extend type WbMutation {
        saveGlobalComponent(
            name: String!
            language: String
            data: WbGlobalComponentInput!
        ): WbGlobalComponentResponse
    }
`;
