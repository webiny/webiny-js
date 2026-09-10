export const GET_EXPERIMENT_PAUSED = /* GraphQL*/ `
    query GetExperimentPaused($experimentId: String!) {
        websiteBuilder {
            getExperimentPaused(experimentId: $experimentId) {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;
