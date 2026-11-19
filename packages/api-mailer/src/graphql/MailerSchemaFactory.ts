import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { ErrorResponse } from "@webiny/api-graphql/responses.js";
import { SendTestMailUseCase } from "~/features/SendTestMail/abstractions.js";

/*
 * The `mailer` mutation namespace and the test email. A transport package with settings (SMTP)
 * extends `MailerMutation` and adds its own `mailer` query.
 */
class MailerSchemaFactoryImpl implements GraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("api-mailer/MailerSchemaFactoryImpl");

    async execute(builder: IGraphQLSchemaBuilder): Promise<IGraphQLSchemaBuilder> {
        builder.addTypeDefs(`
            type MailerTransportSettingsError {
                message: String!
                code: String
                data: JSON
            }

            type MailerSendTestMailResponse {
                data: Boolean
                error: MailerTransportSettingsError
            }

            type MailerMutation {
                sendTestMail(to: String!): MailerSendTestMailResponse!
            }

            extend type Mutation {
                mailer: MailerMutation
            }
        `);

        builder.addResolver({
            path: "Mutation.mailer",
            resolver: () => async () => ({})
        });

        builder.addResolver<{ to: string }>({
            path: "MailerMutation.sendTestMail",
            dependencies: [SendTestMailUseCase],
            resolver:
                (sendTestMail: SendTestMailUseCase.Interface) =>
                async ({ args }) => {
                    try {
                        const result = await sendTestMail.execute({ to: args.to });

                        if (result.isFail()) {
                            return new ErrorResponse(result.error);
                        }

                        return { data: true, error: null };
                    } catch (ex) {
                        return new ErrorResponse(ex);
                    }
                }
        });

        return builder;
    }
}

export const MailerSchemaFactory = GraphQLSchemaFactory.createImplementation({
    implementation: MailerSchemaFactoryImpl,
    dependencies: []
});
