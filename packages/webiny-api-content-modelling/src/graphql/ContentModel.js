export default /* GraphQL */ `
    type ContentModel {
        title: String
        modelId: String
        description: String
        createdOn: DateTime
        createdBy: User
        fields: [ContentModelField]
    }
`;
