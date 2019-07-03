export default /* GraphQL */ `
    type ContentModel {
        id: ID
        title: String
        modelId: String
        description: String
        createdOn: DateTime
        createdBy: User
        fields: [ContentModelField]
    }

    input ContentModelInput {
        title: String
        modelId: String
        description: String
        fields: [ContentModelFieldInput]
    }

    type ContentModelField {
        id: String
        label: String
        fieldId: String
        type: String
        validation: [JSON]
        settings: JSON
    }

    input ContentModelFieldInput {
        id: String
        label: String
        fieldId: String
        type: String
        validation: [JSON]
        settings: JSON
    }

    type ContentModelListResponse {
        data: [ContentModel]
        meta: ListMeta
        error: Error
    }

    type ContentModelResponse {
        data: ContentModel
        error: Error
    }
`;
