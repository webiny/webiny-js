/**
 * The extraction API — see the design brief, section 10.7.
 *
 * `ThemeQuery` and `ThemeMutation` are declared by `@webiny/api-theme`; this extends them, so extraction
 * appears as part of the theme API rather than as a parallel namespace. That matters for the client:
 * generating a theme is a way of creating one, not a separate feature.
 */
export const extractionTypeDefs = /* GraphQL */ `
    input ThemeExtractionInput {
        "Any page on the site. The homepage usually carries the most design intent."
        url: String!
        "Name for the draft theme this produces."
        name: String!
        "Total pages to read, including the entry page. Defaults to 5, and is capped at 10."
        crawlLimit: Int
        "Read the site again instead of reusing a recent crawl."
        force: Boolean
    }

    type ThemeExtractionStarted {
        "The background task, for polling status after a page reload."
        taskId: ID!
        "Correlates the websocket progress messages for this run."
        extractionId: ID!
    }

    type ThemeExtractionStartedResponse {
        data: ThemeExtractionStarted
        error: ThemeError
    }

    enum ThemeExtractionState {
        pending
        running
        failed
        success
        aborted
    }

    type ThemeExtractionUncertainty {
        path: String!
        reason: String!
    }

    type ThemeExtractionStatus {
        taskId: ID!
        state: ThemeExtractionState!
        "Set once the theme exists."
        themeId: ID
        entryUrl: String
        "Pages actually read, which may be fewer than requested."
        sampledUrls: [String!]
        "Present when the run failed, written for the person who started it."
        error: String
    }

    type ThemeExtractionStatusResponse {
        data: ThemeExtractionStatus
        error: ThemeError
    }

    extend type ThemeQuery {
        """
        Whether theme extraction is available on this deployment.

        Its mere presence is the signal: extraction is an opt-in backend, so when the feature is not
        registered this field does not exist on the schema at all — and the Admin reads that absence as
        "unavailable" and hides the "generate from a website" option. When registered it returns true.
        """
        themeExtractionAvailable: Boolean!

        """
        Status of an extraction run.

        Exists so a page reload can recover state without the caller needing background-task
        permissions — the websocket stream is the primary channel, this is the fallback.
        """
        getThemeExtraction(taskId: ID!): ThemeExtractionStatusResponse!
    }

    extend type ThemeMutation {
        extractTheme(data: ThemeExtractionInput!): ThemeExtractionStartedResponse!
        "Stops a running extraction, freeing the one-at-a-time slot."
        abortThemeExtraction(taskId: ID!): ThemeExtractionStartedResponse!
    }
`;
