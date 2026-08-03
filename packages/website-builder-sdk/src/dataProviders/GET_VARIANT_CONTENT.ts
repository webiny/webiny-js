export const GET_VARIANT_CONTENT = /* GraphQL*/ `
    query GetVariantContent($id: ID!) {
        websiteBuilder {
            getVariantContent(id: $id) {
                data {
                    id
                    properties
                    elements
                    bindings
                    extensions
                    metadata
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
