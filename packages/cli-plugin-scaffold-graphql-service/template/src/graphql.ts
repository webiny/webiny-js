const graphql = /* GraphQL */ `
    type TargetDeleteResponse {
        data: Boolean
        error: TargetError
    }

    type TargetListMeta {
        cursor: String
        hasMoreItems: Boolean!
        totalCount: Int!
    }

    type TargetError {
        code: String!
        message: String!
        data: JSON
    }

    type CreatedByResponse {
        id: String!
        displayName: String!
        type: String!
    }

    type Target {
        id: ID!
        createdOn: DateTime!
        savedOn: DateTime!
        createdBy: CreatedByResponse!
        title: String!
        description: String
        isNice: Boolean!
    }

    input TargetCreateInput {
        title: String!
        description: String
        isNice: Boolean
    }

    input TargetUpdateInput {
        title: String
        description: String
        isNice: Boolean
    }

    input TargetListWhereInput {
        # system fields
        id: String
        id_in: [String!]
        id_not: String
        id_not_in: [String!]
        savedOn_gt: DateTime
        savedOn_lt: DateTime
        createdOn_gt: DateTime
        createdOn_lt: DateTime

        # custom fields
        title_contains: String
        title_not_contains: String
        isNice: Boolean
    }

    enum TargetListSort {
        title_ASC
        title_DESC
        createdOn_ASC
        createdOn_DESC
        savedOn_ASC
        savedOn_DESC
    }
    # Response type when querying targe
    type TargetResponse {
        data: Target
        error: TargetError
    }
    # Response type when listing targets
    type TargetListResponse {
        data: [Target]
        meta: TargetListMeta
        error: TargetError
    }
    # A type definition to add the Elasticsearch index
    type InstallResponse {
        data: Boolean
        error: TargetError
    }
    # A type definition to remove the Elasticsearch index
    type UninstallResponse {
        data: Boolean
        error: TargetError
    }

    type TargetQuery {
        getTarget(id: ID!): TargetResponse!

        listTargets(
            where: TargetListWhereInput
            sort: [TargetListSort!]
            limit: Int
            after: String
        ): TargetListResponse!

        isInstalled: InstallResponse!
    }

    type TargetMutation {
        createTarget(data: TargetCreateInput!): TargetResponse!

        updateTarget(id: ID!, data: TargetUpdateInput!): TargetResponse!

        deleteTarget(id: ID!): TargetDeleteResponse!

        install: InstallResponse!

        uninstall: UninstallResponse!
    }
    # we need to extend the original Query with targets so we can write a query like { targets: { listTargets {...} } }
    extend type Query {
        targets: TargetQuery
    }
    # we need to extend the original Mutation with targets so we can write a mutation like { targets: { createTarget {...} } }
    extend type Mutation {
        targets: TargetMutation
    }
`;
export default graphql;
