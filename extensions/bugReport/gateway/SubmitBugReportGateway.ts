import { MainGraphQLClient } from "webiny/admin";
import { SubmitBugReportGateway as Abstraction } from "./abstractions.js";
import type { IBugReportPayload } from "../shared/types.js";
import type { IFiledIssue } from "../shared/types.js";

const REPORT_BUG = /* GraphQL */ `
    mutation ReportBug($input: JSON!) {
        reportBug(input: $input) {
            number
            url
            error
        }
    }
`;

interface IReportBugResponse {
    reportBug: {
        number: number | null;
        url: string | null;
        error: string | null;
    };
}

class SubmitBugReportGatewayImpl implements Abstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(payload: IBugReportPayload): Promise<IFiledIssue> {
        const response = await this.client.execute<IReportBugResponse>({
            query: REPORT_BUG,
            variables: { input: payload }
        });

        const result = response.reportBug;

        if (result.error) {
            throw new Error(result.error);
        }

        if (typeof result.number !== "number" || typeof result.url !== "string") {
            throw new Error("The API filed the report but returned no issue.");
        }

        return { number: result.number, url: result.url };
    }
}

export const SubmitBugReportGateway = Abstraction.createImplementation({
    implementation: SubmitBugReportGatewayImpl,
    dependencies: [MainGraphQLClient]
});
