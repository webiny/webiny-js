export const GET_PAGE_EXPERIMENT = /* GraphQL*/ `
    query GetPageExperiment($path: String!) {
        websiteBuilder {
            getPageExperiment(path: $path) {
                data {
                    experimentId
                    revisionId
                    pageEntryId
                    path
                    status
                    controlVariantId
                    tenantId
                    trafficSplit
                    targeting
                    analytics
                    variants {
                        variantId
                        name
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
