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
        type: String!
        displayName: String!
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
        before: String
        after: String
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
            limit: Int
            before: String
            after: String
            sort: TargetDataModelsListSort
        ): TargetDataModelsList!
    }

    type TargetDataModelMutation {
        # Creates and returns a new TargetDataModel entry.
        createTargetDataModel(data: TargetDataModelCreateInput!): TargetDataModel!

        # Updates and returns an existing TargetDataModel entry.
        updateTargetDataModel(id: ID!, data: TargetDataModelUpdateInput!): TargetDataModel!

        # Deletes and returns an existing TargetDataModel entry.
        deleteTargetDataModel(id: ID!): TargetDataModel!
    }

    extend type Query {
        targetDataModels: TargetDataModelQuery
    }

    extend type Mutation {
        targetDataModels: TargetDataModelMutation
    }
`;
