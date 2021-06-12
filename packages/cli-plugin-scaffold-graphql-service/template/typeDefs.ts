export default /* GraphQL */ `
    type Target {
        id: ID!
        title: String!
        description: String
        createdOn: DateTime!
        savedOn: DateTime!
        createdBy: TargetCreatedBy
    }

    type TargetCreatedBy {
        id: String!
        displayName: String!
        type: String!
    }

    input TargetCreateInput {
        title: String!
        description: String
    }

    input TargetUpdateInput {
        title: String
        description: String
    }

    type TargetsListMeta {
        limit: Number
        cursor: String
    }

    enum TargetsListSort {
        createdOn_ASC
        createdOn_DESC
    }

    type TargetsList {
        data: [Target]
        meta: TargetsListMeta
    }

    type TargetQuery {
        getTarget(id: ID!): Target
        listTargets(sort: TargetsListSort, limit: Int, after: String): TargetsList!
    }

    type TargetMutation {
        createTarget(data: TargetCreateInput!): Target!
        updateTarget(id: ID!, data: TargetUpdateInput!): Target!
        deleteTarget(id: ID!): Target!
    }

    extend type Query {
        targets: TargetQuery
    }

    extend type Mutation {
        targets: TargetMutation
    }
`;
