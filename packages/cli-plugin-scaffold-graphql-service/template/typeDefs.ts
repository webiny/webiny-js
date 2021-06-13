export default /* GraphQL */ `
    type TargetDataModel {
        id: ID!
        title: String!
        description: String
        createdOn: DateTime!
        savedOn: DateTime!
        createdBy: TargetDataModelCreatedBy
    }

    type TargetDataModelCreatedBy {
        id: String!
        displayName: String!
        type: String!
    }

    input TargetDataModelCreateInput {
        title: String!
        description: String
    }

    input TargetDataModelUpdateInput {
        title: String
        description: String
    }

    type TargetDataModelsListMeta {
        limit: Number
        cursor: String
    }

    enum TargetDataModelsListSort {
        createdOn_ASC
        createdOn_DESC
    }

    type TargetDataModelsList {
        data: [TargetDataModel]
        meta: TargetDataModelsListMeta
    }

    type TargetDataModelQuery {
        getTargetDataModel(id: ID!): TargetDataModel
        listTargetDataModels(
            sort: TargetDataModelsListSort
            limit: Int
            after: String
        ): TargetDataModelsList!
    }

    type TargetDataModelMutation {
        createTargetDataModel(data: TargetDataModelCreateInput!): TargetDataModel!
        updateTargetDataModel(id: ID!, data: TargetDataModelUpdateInput!): TargetDataModel!
        deleteTargetDataModel(id: ID!): TargetDataModel!
    }

    extend type Query {
        targetDataModels: TargetDataModelQuery
    }

    extend type Mutation {
        targetDataModels: TargetDataModelMutation
    }
`;
