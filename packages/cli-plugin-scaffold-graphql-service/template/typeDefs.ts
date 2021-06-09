export default /* GraphQL */ `
    type Target {
        id: ID!
        savedOn: DateTime!
        createdBy: TargetCreatedBy!
        title: String!
        description: String
    }

    type TargetsListMeta {
        limit: Number
        cursor: String
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

    enum TargetsListSortOrder {
        asc
        desc
    }

    input TargetsListSort {
        savedOn: String
    }

    type TargetsListResponse {
        data: [Target]
        meta: TargetsListMeta
    }

    type TargetQuery {
        getTarget(id: ID!): Target
        listTargets(sort: TargetsListSort, limit: Int, after: String): TargetsListResponse!
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
