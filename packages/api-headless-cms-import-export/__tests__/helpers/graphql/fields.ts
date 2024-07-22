export const createErrorFields = () => {
    return /* GraphQL */ `
        error {
            code
            message
            data
        }
    `;
};

export const createExportFields = () => {
    return /* GraphQL */ `
        id
        createdOn
        createdBy {
            id
            displayName
            type
        }
        finishedOn
        modelId
        files {
            get
            head
            type
        }
        status
    `;
};

export const createValidateImportFromUrlFields = () => {
    return /* GraphQL */ `
        id
        status
        files {
            get
            head
            type
            error {
                message
                data
            }
        }
    `;
};
