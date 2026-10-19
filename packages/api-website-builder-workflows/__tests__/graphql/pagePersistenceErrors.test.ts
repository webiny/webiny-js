import { beforeEach, describe, expect, it } from "vitest";
import { asGraphQLUser, LIST_WORKFLOWS } from "~tests/__helpers/graphql.js";
import { failListWorkflows } from "~tests/__helpers/FailingListWorkflows.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";

/** The raw text `failListWorkflows` fails with. */
const RAW = "Storage is down.";

describe("WB workflows GraphQL storage failures", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("returns the fixed message and logs the storage error on the server", async () => {
        const admin = asGraphQLUser({ legacyPlugins: [failListWorkflows, captureLoggedErrors] });

        const body = await admin.run(LIST_WORKFLOWS);
        const envelope = body.data.websiteBuilder.listWebsiteBuilderPageWorkflows;

        expect(envelope.data).toBeNull();
        expect(envelope.error).toEqual({
            code: "Workflows/Workflow/Persistence",
            message: "The workflow could not be read or saved.",
            data: { cause: {} }
        });
        expect(JSON.stringify(body)).not.toContain(RAW);
        expect(JSON.stringify(loggedErrors.map(entry => String(entry.fields.error)))).toContain(
            RAW
        );
    });
});
