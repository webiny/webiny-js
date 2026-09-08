import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
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
class BugReportGraphQLSchemaImpl implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type BugReportResult {
                "\`filed\` when the API created the issue, \`compose\` when it returned a prefilled URL."
                mode: String
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
                        const outcome = await useCase.execute(args.input);
                        return {
                            mode: outcome.mode,
                            number: outcome.number,
                            url: outcome.url,
                            error: null
                        };
                    } catch (error) {
                        logger.error({ error }, "Filing a bug report failed.");
                        return {
                            mode: null,
                            number: null,
                            url: null,
                            error: describeFailure(error)
                        };
                    }
                };
            }
        });

        return builder;
    }
}

export const BugReportGraphQLSchema = GraphQLSchemaFactory.createImplementation({
    implementation: BugReportGraphQLSchemaImpl,
    dependencies: []
});
