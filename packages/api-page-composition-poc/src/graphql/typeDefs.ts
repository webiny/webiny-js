/**
 * The page-composition PoC API — two fields, deliberately.
 *
 * `pageCompositionPocComposePages` triggers the composition for a run; `pageCompositionPocPageMap`
 * reads back what it produced, which is also what W10.3 and the discard log consume.
 */
export const pageCompositionTypeDefs = /* GraphQL */ `
    type PageCompositionPocError {
        message: String
        code: String
        data: JSON
    }

    type PageCompositionPocTriggerData {
        taskId: String!
        runId: String!
    }

    type PageCompositionPocTriggerResponse {
        data: PageCompositionPocTriggerData
        error: PageCompositionPocError
    }

    type PageCompositionPocPageMapResponse {
        "The run's source-URL to page map, or null if the run has not been composed."
        data: JSON
        error: PageCompositionPocError
    }

    extend type Query {
        pageCompositionPocPageMap(runId: ID!): PageCompositionPocPageMapResponse
    }

    extend type Mutation {
        pageCompositionPocComposePages(runId: ID!): PageCompositionPocTriggerResponse
    }
`;
