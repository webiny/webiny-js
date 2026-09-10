import { ErrorResponse, Response } from "@webiny/api-graphql/responses.js";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { LoginUseCase } from "~/api/features/Login/index.js";

/**
 * Public auth surface for the self-hosted IdP. `login` is intentionally
 * unauthenticated — it is how an identity is obtained in the first place.
 */
class SelfHostedAuthSchemaImpl implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): CoreGraphQLSchemaFactory.Return {
        builder.addTypeDefs(/* GraphQL */ `
            type SelfHostedAuthLoginData {
                token: String!
                expiresIn: Int!
            }

            type SelfHostedAuthLoginResponse {
                data: SelfHostedAuthLoginData
                error: SelfHostedAuthError
            }

            type SelfHostedAuthError {
                code: String
                message: String
                data: JSON
            }

            extend type Mutation {
                """
                Exchange a username/password pair for a signed JWT.
                """
                selfHostedAuthLogin(email: String!, password: String!): SelfHostedAuthLoginResponse
            }
        `);

        builder.addResolver({
            path: "Mutation.selfHostedAuthLogin",
            dependencies: [LoginUseCase],
            resolver: (loginUseCase: LoginUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await loginUseCase.execute({
                        email: args.email,
                        password: args.password
                    });

                    if (result.isFail()) {
                        return new ErrorResponse({
                            message: result.error.message,
                            code: result.error.code,
                            data: result.error.data
                        });
                    }

                    return new Response(result.value);
                };
            }
        });

        return builder;
    }
}

export const SelfHostedAuthSchema = CoreGraphQLSchemaFactory.createImplementation({
    implementation: SelfHostedAuthSchemaImpl,
    dependencies: []
});
