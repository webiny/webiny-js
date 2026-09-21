import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/feature/api";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { SelfHostedAuthCliResetPasswordSchema } from "~/api/graphql/cliResetPassword.gql.js";
import { CLI_PASSWORD_RESET_BUILD_PARAM } from "~/shared/buildParams.js";

/**
 * `cliPasswordReset={false}` has to remove the mutation, not merely make it refuse. A disabled
 * door that still shows up in introspection is not what someone flipping the flag is asking for.
 */

const createBuilder = () => {
    const builder = {
        addTypeDefs: vi.fn(),
        addResolver: vi.fn()
    };

    return builder as unknown as CoreGraphQLSchemaFactory.SchemaBuilder & typeof builder;
};

const buildSchema = async (flag: boolean | string | null) => {
    const container = new Container();

    container.registerInstance(BuildParams, {
        get: <T>(key: string) => (key === CLI_PASSWORD_RESET_BUILD_PARAM ? (flag as T) : null)
    });

    container.register(SelfHostedAuthCliResetPasswordSchema);

    const builder = createBuilder();
    await container.resolve(CoreGraphQLSchemaFactory).execute(builder);

    return builder;
};

describe("CLI reset password schema", () => {
    it("adds the mutation when the flag is not set", async () => {
        const builder = await buildSchema(null);

        expect(builder.addTypeDefs).toHaveBeenCalledOnce();
        expect(builder.addResolver).toHaveBeenCalledOnce();
        expect(builder.addResolver.mock.calls[0][0].path).toBe(
            "Mutation.selfHostedAuthCliResetPassword"
        );
    });

    it("adds the mutation when the flag is on", async () => {
        const builder = await buildSchema(true);

        expect(builder.addTypeDefs).toHaveBeenCalledOnce();
        expect(builder.addResolver).toHaveBeenCalledOnce();
    });

    it("adds nothing at all when the flag is off", async () => {
        const builder = await buildSchema(false);

        expect(builder.addTypeDefs).not.toHaveBeenCalled();
        expect(builder.addResolver).not.toHaveBeenCalled();
    });

    it("treats a stringified false as off, since build params may serialize", async () => {
        const builder = await buildSchema("false");

        expect(builder.addTypeDefs).not.toHaveBeenCalled();
        expect(builder.addResolver).not.toHaveBeenCalled();
    });
});
