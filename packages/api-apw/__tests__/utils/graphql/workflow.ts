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

export const CREATE_WORKFLOW_MUTATION = /* GraphQL */ `
    mutation CreateWorkflowMutation($data: ApwCreateWorkflowInput!) {
        advancedPublishingWorkflow {
            createWorkflow(data: $data) {
                data {
                    id
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;
