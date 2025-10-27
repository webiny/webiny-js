export const createSavedByField = () => {
    return {
        id: "savedBy",
        type: "object",
        fieldId: "savedBy",
        storageId: "object@savedBy",
        label: "User",
        settings: {
            fields: [
                {
                    id: "id",
                    type: "text",
                    fieldId: "id",
                    storageId: "text@id",
                    label: "ID",
                    validation: [
                        {
                            name: "required",
                            message: "ID is required."
                        }
                    ]
                },
                {
                    id: "displayName",
                    type: "text",
                    fieldId: "displayName",
                    storageId: "text@displayName",
                    label: "Display Name",
                    validation: [
                        {
                            name: "required",
                            message: "Display name is required."
                        }
                    ]
                },
                {
                    id: "type",
                    type: "text",
                    fieldId: "type",
                    storageId: "text@type",
                    label: "Type",
                    validation: [
                        {
                            name: "required",
                            message: "Type is required."
                        }
                    ]
                }
            ]
        }
    };
};
