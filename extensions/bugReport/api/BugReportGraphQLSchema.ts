import { GraphQLSchemaFactory } from "webiny/api/graphql";
import { Logger } from "webiny/api";
import { SubmitBugReportUseCase } from "./abstractions.js";
import type { IBugReportPayload } from "../shared/types.js";

interface IReportBugArgs {
    input: IBugReportPayload;
}

function describeFailure(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

/*
 * `input` is a JSON scalar rather than a declared input type. The payload is a screenshot plus a
 * loose event log, so a typed input would be six declarations that buy nothing: the use case
 * reads what it needs and the browser is the only caller.
 *
 * Errors come back inside the envelope instead of in `errors`, so the dialog can show the
 * reporter what went wrong without depending on how the client surfaces GraphQL errors.
 */
class BugReportGraphQLSchema implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type BugReportResult {
                number: Int
                url: String
                error: String
            }

            extend type Mutation {
                reportBug(input: JSON!): BugReportResult!
            }
        `);

        builder.addResolver<IReportBugArgs>({
            path: "Mutation.reportBug",
            dependencies: [SubmitBugReportUseCase, Logger],
            resolver: (useCase: SubmitBugReportUseCase.Interface, logger: Logger.Interface) => {
                return async ({ args }) => {
                    try {
                        const issue = await useCase.execute(args.input);
                        return { number: issue.number, url: issue.url, error: null };
                    } catch (error) {
                        logger.error({ error }, "Filing a bug report failed.");
                        return { number: null, url: null, error: describeFailure(error) };
                    }
                };
            }
        });

        return builder;
    }
}

export default GraphQLSchemaFactory.createImplementation({
    implementation: BugReportGraphQLSchema,
    dependencies: []
});
