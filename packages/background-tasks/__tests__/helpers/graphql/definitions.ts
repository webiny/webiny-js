export const createListDefinitionsQuery = () => {
    return /* GraphQL */ `
        query ListDefinitions {
            backgroundTasks {
                listDefinitions {
                    data {
                        id
                        title
                        description
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
