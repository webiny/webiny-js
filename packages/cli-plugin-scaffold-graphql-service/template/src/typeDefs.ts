export default /* GraphQL */ `
    # Response for the delete mutation.
    type TargetDeleteResponse {
        data: Boolean
        error: TargetError
    }

    # meta property containing:
    #   cursor - the last target received in the list
    #   hasMoreItems - if there are more targets to load
    type TargetListMeta {
        cursor: String
        hasMoreItems: Boolean!
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
        createdBy: TargetCreatedByResponse!
        title: String!
        description: String
    }

    # input definition whe  n creating the target
    input TargetCreateInput {
        title: String!
        description: String
    }

    # input definition when updating the target
    input TargetUpdateInput {
        title: String
        description: String
    }

    # possible sort options when listing targets
    enum TargetListSort {
        createdOn_ASC
        createdOn_DESC
    }

    # Response type when querying target
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
            sort: [TargetListSort!]
            limit: Int
            after: String
        ): TargetListResponse!
    }

    type TargetMutation {
        createTarget(data: TargetCreateInput!): TargetResponse!

        updateTarget(id: ID!, data: TargetUpdateInput!): TargetResponse!

        deleteTarget(id: ID!): TargetDeleteResponse!
    }

    extend type Query {
        targets: TargetQuery
    }

    extend type Mutation {
        targets: TargetMutation
    }
`;
