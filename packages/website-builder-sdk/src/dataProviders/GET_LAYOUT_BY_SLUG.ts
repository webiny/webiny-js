export const GET_LAYOUT_BY_SLUG = /* GraphQL*/ `
    query GetLayoutBySlug($slug: String!, $language: String) {
        websiteBuilder {
            getLayoutBySlug(slug: $slug, language: $language) {
                data {
                    elements
                    bindings
                    layout {
                        id
                        entryId
                        properties
                        elements
                        bindings
                    }
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;
