export const GET_APP_MODEL = /* GraphQL */ `
    query GetAppModel($id: ID!) {
        aco {
            getAppModel(id: $id) {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;
