import { beforeEach, describe, expect, it } from "vitest";
import { createGraphQLClient } from "~tests/__helpers/graphql.js";
import { failListWorkflows } from "~tests/__helpers/FailingListWorkflows.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";

/** The raw text `failListWorkflows` fails with. */
const RAW = "Storage is down.";

const LIST_WORKFLOWS = /* GraphQL */ `
    query ListWorkflows {
        cms {
            listCmsEntryWorkflows {
                data {
                    id
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

describe("CMS workflows GraphQL storage failures", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("returns the fixed message and logs the storage error on the server", async () => {
        const graphql = createGraphQLClient({
            legacyPlugins: [failListWorkflows, captureLoggedErrors]
        });

        const body = await graphql(LIST_WORKFLOWS);
        const envelope = body.data.cms.listCmsEntryWorkflows;

        expect(envelope.data).toBeNull();
        expect(envelope.error).toEqual({
            code: "Workflows/Workflow/Persistence",
            message: "The workflow could not be read or saved.",
            data: { cause: {} }
        });
        expect(JSON.stringify(body)).not.toContain(RAW);
        // Pino serialises an Error with its message and stack only under the `err` key.
        const logged = loggedErrors.find(entry => entry.fields.err instanceof Error);
        const cause = logged?.fields.err as Error | undefined;
        expect(cause?.message).toBe(RAW);
        expect(cause?.stack).toContain(RAW);
    });
});
