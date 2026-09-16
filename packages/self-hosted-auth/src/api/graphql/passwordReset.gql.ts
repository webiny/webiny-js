import { ErrorResponse, Response } from "@webiny/api-graphql/responses.js";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { RequestPasswordResetUseCase } from "~/api/features/RequestPasswordReset/index.js";
import { ResetPasswordWithCodeUseCase } from "~/api/features/ResetPasswordWithCode/index.js";
import { EMAIL_PASSWORD_RESET_BUILD_PARAM } from "~/shared/buildParams.js";
import { isEmailPasswordResetEnabled } from "~/shared/buildParams.js";

/**
 * The self-service password reset: ask for a code, then spend it. Both mutations are
 * unauthenticated, like `selfHostedAuthLogin`, because a user who could authenticate would not need
 * them.
 *
 * When `<SelfHostedAuth emailPasswordReset={false} />` is set, neither mutation is added, the same
 * way the CLI reset mutation disappears under its own flag. A disabled flow that still answers in
 * introspection is not disabled.
 */
class SelfHostedAuthPasswordResetSchemaImpl implements CoreGraphQLSchemaFactory.Interface {
    private readonly enabled: boolean;

    constructor(buildParams: BuildParams.Interface) {
        this.enabled = isEmailPasswordResetEnabled(
            buildParams.get<boolean | string>(EMAIL_PASSWORD_RESET_BUILD_PARAM)
        );
    }

    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        if (!this.enabled) {
            return builder;
        }

        // `SelfHostedAuthError` comes from the always-registered `SelfHostedAuthSchema`.
        builder.addTypeDefs(/* GraphQL */ `
            type SelfHostedAuthRequestPasswordResetResponse {
                data: Boolean
                error: SelfHostedAuthError
            }

            type SelfHostedAuthResetPasswordResponse {
                data: Boolean
                error: SelfHostedAuthError
            }

            extend type Mutation {
                """
                Requests a password reset code by email. Succeeds whether or not an account exists
                for the address, so the response cannot be used to discover which addresses are
                registered. Reports an error only when the installation cannot send mail at all, or
                when too many codes have already been requested for the address.
                """
                selfHostedAuthRequestPasswordReset(
                    email: String!
                ): SelfHostedAuthRequestPasswordResetResponse

                """
                Sets a new password using a code delivered by email. The code is single use, expires
                shortly after it is issued, and dies after a handful of wrong guesses.
                """
                selfHostedAuthResetPassword(
                    email: String!
                    code: String!
                    password: String!
                ): SelfHostedAuthResetPasswordResponse
            }
        `);

        builder.addResolver({
            path: "Mutation.selfHostedAuthRequestPasswordReset",
            dependencies: [RequestPasswordResetUseCase],
            resolver: (useCase: RequestPasswordResetUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await useCase.execute({ email: args.email });

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

        builder.addResolver({
            path: "Mutation.selfHostedAuthResetPassword",
            dependencies: [ResetPasswordWithCodeUseCase],
            resolver: (useCase: ResetPasswordWithCodeUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await useCase.execute({
                        email: args.email,
                        code: args.code,
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

export const SelfHostedAuthPasswordResetSchema = CoreGraphQLSchemaFactory.createImplementation({
    implementation: SelfHostedAuthPasswordResetSchemaImpl,
    dependencies: [BuildParams]
});
