export const experimentsTypeDefs = /* GraphQL */ `
    type WbExperiment {
        id: ID!
        entryId: String!
        pageEntryId: String!
        baselineRevisionId: String!
        status: String!
        name: String!
        trafficSplit: JSON
        targeting: JSON
        goals: JSON
        analytics: JSON
        startedOn: DateTime
        stoppedOn: DateTime
        winningVariantId: String
        createdOn: DateTime
        savedOn: DateTime
        createdBy: WbIdentity
    }

    type WbVariant {
        id: ID!
        entryId: String!
        experimentId: String!
        name: String!
        status: String!
        properties: JSON
        metadata: JSON
        bindings: JSON
        elements: JSON
        extensions: JSON
        createdOn: DateTime
        savedOn: DateTime
    }

    input WbExperimentCreateInput {
        pageEntryId: String!
        baselineRevisionId: String!
        name: String!
        trafficSplit: JSON
        targeting: JSON
        goals: JSON
        analytics: JSON
    }

    input WbExperimentUpdateInput {
        name: String
        trafficSplit: JSON
        targeting: JSON
        goals: JSON
        analytics: JSON
    }

    input WbVariantCreateInput {
        experimentId: String!
        name: String!
    }

    input WbVariantUpdateInput {
        name: String
        status: String
        properties: JSON
        metadata: JSON
        bindings: JSON
        elements: JSON
        extensions: JSON
    }

    type WbExperimentResponse {
        data: WbExperiment
        error: WbError
    }

    type WbExperimentsListResponse {
        data: [WbExperiment!]
        error: WbError
    }

    type WbVariantResponse {
        data: WbVariant
        error: WbError
    }

    type WbVariantsListResponse {
        data: [WbVariant!]
        error: WbError
    }

    # Public, SDK-facing shapes. These never expose provider-specific fields.
    type WbActiveExperimentVariant {
        variantId: String!
        name: String!
    }

    type WbActiveExperiment {
        experimentId: String!
        revisionId: String!
        pageEntryId: String!
        path: String!
        status: String!
        tenantId: String!
        controlVariantId: String!
        trafficSplit: JSON
        targeting: JSON
        analytics: JSON
        variants: [WbActiveExperimentVariant!]!
    }

    type WbActiveExperimentResponse {
        data: WbActiveExperiment
        error: WbError
    }

    type WbVariantContent {
        id: ID!
        properties: JSON
        bindings: JSON
        elements: JSON
        extensions: JSON
        metadata: JSON
    }

    type WbVariantContentResponse {
        data: WbVariantContent
        error: WbError
    }

    extend type WbQuery {
        getExperiment(id: ID!): WbExperimentResponse
        getActiveExperiment(revisionId: ID!): WbExperimentResponse
        listExperiments(pageEntryId: String!): WbExperimentsListResponse
        getVariant(id: ID!): WbVariantResponse
        listVariants(experimentId: String!): WbVariantsListResponse

        # SDK-facing public reads.
        getPageExperiment(path: String!): WbActiveExperimentResponse
        getVariantContent(id: ID!): WbVariantContentResponse
    }

    extend type WbMutation {
        createExperiment(data: WbExperimentCreateInput!): WbExperimentResponse
        updateExperiment(id: ID!, data: WbExperimentUpdateInput!): WbExperimentResponse
        startExperiment(id: ID!): WbExperimentResponse
        stopExperiment(id: ID!): WbExperimentResponse
        graduateVariant(experimentId: ID!, variantId: ID!): WbPageResponse

        createVariant(data: WbVariantCreateInput!): WbVariantResponse
        updateVariant(id: ID!, data: WbVariantUpdateInput!): WbVariantResponse
        deleteVariant(id: ID!): WbBooleanResponse
    }
`;
