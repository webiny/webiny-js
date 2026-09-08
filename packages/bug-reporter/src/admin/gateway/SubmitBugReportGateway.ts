import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { SubmitBugReportGateway as Abstraction } from "./abstractions.js";
import type { IBugReportOutcome } from "../../shared/types.js";
import type { IBugReportPayload } from "../../shared/types.js";

const REPORT_BUG = /* GraphQL */ `
    mutation ReportBug($input: JSON!) {
        reportBug(input: $input) {
            mode
            number
            url
            error
        }
    }
`;

interface IReportBugResponse {
    reportBug: {
        mode: string | null;
        number: number | null;
        url: string | null;
        error: string | null;
    };
}

class SubmitBugReportGatewayImpl implements Abstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(payload: IBugReportPayload): Promise<IBugReportOutcome> {
        const response = await this.client.execute<IReportBugResponse>({
            query: REPORT_BUG,
            variables: { input: payload }
        });

        const result = response.reportBug;

        if (result.error) {
            throw new Error(result.error);
        }

        if (typeof result.url !== "string") {
            throw new Error("The API accepted the report but returned no URL.");
        }

        if (result.mode === "compose") {
            return { mode: "compose", url: result.url, number: null };
        }

        return { mode: "filed", url: result.url, number: result.number };
    }
}

export const SubmitBugReportGateway = Abstraction.createImplementation({
    implementation: SubmitBugReportGatewayImpl,
    dependencies: [MainGraphQLClient]
});
