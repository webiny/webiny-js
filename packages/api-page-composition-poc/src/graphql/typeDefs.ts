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

    "One page's upload target: where to PUT the screenshot, and the ref to record for it."
    type PageCompositionPocUploadTarget {
        path: String!
        "The blob key to send back in \`pageCompositionPocRecordComposedCapture\`."
        ref: String!
        "A short-lived pre-signed PUT URL. Send the bytes with this exact \`contentType\`."
        uploadUrl: String!
        contentType: String!
    }

    type PageCompositionPocUploadTargetsData {
        "The composition these screenshots will be photographing. Record it with them."
        composeVersion: Int!
        targets: [PageCompositionPocUploadTarget!]!
    }

    type PageCompositionPocUploadTargetsResponse {
        data: PageCompositionPocUploadTargetsData
        error: PageCompositionPocError
    }

    input PageCompositionPocComposedCapturePageInput {
        path: String!
        "\`captured\` or \`skipped\`."
        status: String!
        "The ref from the upload target. Omit when skipped."
        screenshotRef: String
        "Why this page has no screenshot. Required when skipped."
        reason: String
        "Only when this page was rendered at something other than the run-level width."
        viewportWidth: Int
    }

    input PageCompositionPocComposedCaptureInput {
        composeVersion: Int!
        capturedAt: String!
        viewportWidth: Int!
        pages: [PageCompositionPocComposedCapturePageInput!]!
    }

    type PageCompositionPocComposedCaptureResponse {
        "The stored record, or null if nobody has captured this run's composed pages."
        data: JSON
        error: PageCompositionPocError
    }

    extend type Query {
        pageCompositionPocPageMap(runId: ID!): PageCompositionPocPageMapResponse
        "Screenshots of this run's composed pages, from a local harness run. Null until someone runs it."
        pageCompositionPocComposedCapture(runId: ID!): PageCompositionPocComposedCaptureResponse
    }

    extend type Mutation {
        pageCompositionPocComposePages(runId: ID!): PageCompositionPocTriggerResponse
        """
        Pre-signed PUT URLs for a local harness to upload composed screenshots to.

        Writes nothing: the record is written afterwards by
        \`pageCompositionPocRecordComposedCapture\`, so a failed upload cannot leave the run claiming
        an image that was never stored.
        """
        pageCompositionPocComposedUploadTargets(
            runId: ID!
            paths: [String!]!
        ): PageCompositionPocUploadTargetsResponse
        """
        Record what a local harness captured, replacing any previous record for this run.

        Called after the bytes are up. Pages the harness could not render are recorded with their
        reason rather than omitted — a comparison tool that hides a page hides a defect.
        """
        pageCompositionPocRecordComposedCapture(
            runId: ID!
            data: PageCompositionPocComposedCaptureInput!
        ): PageCompositionPocComposedCaptureResponse
    }
`;
