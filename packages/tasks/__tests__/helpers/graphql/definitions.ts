export const createListDefinitionsQuery = () => {
    return /* GraphQL */ `
        query ListDefinitions {
            backgroundTasks {
                listDefinitions {
                    data {
                        id
                        title
                        description
                        fields
                    }
                    error {
                        message
                        code
                        data
                    }
                }
            }
        }
    `;
};
