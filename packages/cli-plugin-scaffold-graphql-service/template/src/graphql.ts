const graphql = /* GraphQL */ `
    # response for the delete mutation
    type TargetDeleteResponse {
        data: Boolean
        error: TargetError
    }
    # meta property containing:
    #   cursor - the last target received in the list
    #   hasMoreItems - if there are more targets to load
    #   totalCount - total amount of targets that can be fetched with given query
    type TargetListMeta {
        cursor: String
        hasMoreItems: Boolean!
        totalCount: Int!
    }
    # response error definition
    type TargetError {
        code: String!
        message: String!
        data: JSON
    }
    # target is created by whom?
    type TargetCreatedByResponse {
        id: String!
        displayName: String!
        type: String!
    }
    # target definition
    type Target {
        id: ID!
        createdOn: DateTime!
        savedOn: DateTime!
        createdBy: TargetCreatedByResponse!
        title: String!
        description: String
        isNice: Boolean!
    }
    # input definition when creating the target
    input TargetCreateInput {
        title: String!
        description: String
        isNice: Boolean
    }
    # input definition when updating the target
    input TargetUpdateInput {
        title: String
        description: String
        isNice: Boolean
    }
    # possible where filters when listing targets
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
    # possible sort options when listing targets
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

    type TargetQuery {
        getTarget(id: ID!): TargetResponse!

        listTargets(
            where: TargetListWhereInput
            sort: [TargetListSort!]
            limit: Int
            after: String
        ): TargetListResponse!

        isInstalled: TargetInstallResponse!
    }

    type TargetMutation {
        createTarget(data: TargetCreateInput!): TargetResponse!

        updateTarget(id: ID!, data: TargetUpdateInput!): TargetResponse!

        deleteTarget(id: ID!): TargetDeleteResponse!

        install: TargetInstallResponse!

        uninstall: TargetUninstallResponse!
    }
    # We need to extend the original Query with targets so we can write a query like { targets: { listTargets {...} } }
    extend type Query {
        targets: TargetQuery
    }
    # We need to extend the original Mutation with targets so we can write a mutation like { targets: { createTarget {...} } }
    extend type Mutation {
        targets: TargetMutation
    }
`;
export default graphql;
