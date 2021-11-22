const ERROR_FIELDS = `
{
    message
    code
    data
}`;

export const GET_WORKFLOW_QUERY = /* GraphQL */ `
    query GetWorkflow($id: ID!) {
        advancedPublishingWorkflow {
            getWorkflow(id: $id) {
                data {
                    id
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const INSTALL_MUTATION = /* GraphQL */ `
    mutation CmsInstall {
        cms {
            install {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;
