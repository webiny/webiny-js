import { ErrorResponse, Response } from "@webiny/api-graphql/responses.js";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { CliResetPasswordUseCase } from "~/api/features/CliResetPassword/index.js";
import { CLI_PASSWORD_RESET_BUILD_PARAM, isCliPasswordResetEnabled } from "~/shared/buildParams.js";

/**
 * The API half of the `webiny reset-password` escape hatch. Unauthenticated, like
 * `selfHostedAuthLogin`, but inert without a token signed by the project's JWT signing secret.
 *
 * When `<SelfHostedAuth cliPasswordReset={false} />` is set, nothing is added to the schema at
 * all. The mutation does not exist, rather than existing and refusing. Someone who turns the
 * flag off is closing a door, and a door that still appears in introspection is not closed.
 */
class SelfHostedAuthCliResetPasswordSchemaImpl implements CoreGraphQLSchemaFactory.Interface {
    private readonly enabled: boolean;

    constructor(buildParams: BuildParams.Interface) {
        this.enabled = isCliPasswordResetEnabled(
            buildParams.get<boolean | string>(CLI_PASSWORD_RESET_BUILD_PARAM)
        );
    }

    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        if (!this.enabled) {
            return builder;
        }

        // `SelfHostedAuthError` comes from the always-registered `SelfHostedAuthSchema`; both are
        // registered by `SelfHostedAuthApiFeature`, so it is in the merged type defs either way.
        builder.addTypeDefs(/* GraphQL */ `
            type SelfHostedAuthCliResetPasswordResponse {
                data: Boolean
                error: SelfHostedAuthError
            }

            extend type Mutation {
                """
                Set a user's password using a token minted by the \`webiny reset-password\` CLI
                command. The token is signed with the project's JWT signing secret and names the
                account it may act on. Intended as a lockout escape hatch, not a user-facing flow.
                """
                selfHostedAuthCliResetPassword(
                    token: String!
                    password: String!
                ): SelfHostedAuthCliResetPasswordResponse
            }
        `);

        builder.addResolver({
            path: "Mutation.selfHostedAuthCliResetPassword",
            dependencies: [CliResetPasswordUseCase],
            resolver: (useCase: CliResetPasswordUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await useCase.execute({
                        token: args.token,
                        password: args.password
                    });

                    if (result.isFail()) {
                        return new ErrorResponse({
                            message: result.error.message,
                            code: result.error.code,
                            data: result.error.data
                        });
                    }

                    return new Response(true);
                };
            }
        });

        return builder;
    }
}

export const SelfHostedAuthCliResetPasswordSchema = CoreGraphQLSchemaFactory.createImplementation({
    implementation: SelfHostedAuthCliResetPasswordSchemaImpl,
    dependencies: [BuildParams]
});
