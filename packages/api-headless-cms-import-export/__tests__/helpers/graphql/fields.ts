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
            key
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
            size
            error {
                message
                data
            }
        }
    `;
};
