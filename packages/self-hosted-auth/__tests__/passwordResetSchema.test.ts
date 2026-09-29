import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/feature/api";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { SelfHostedAuthPasswordResetSchema } from "~/api/graphql/passwordReset.gql.js";
import { EMAIL_PASSWORD_RESET_BUILD_PARAM } from "~/shared/buildParams.js";

/**
 * `emailPasswordReset={false}` removes both mutations rather than leaving them to refuse, for the
 * same reason the CLI flag does: a project that turns self-service reset off is saying it does not
 * exist, and a mutation visible in introspection contradicts that.
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
        get: <T>(key: string) => (key === EMAIL_PASSWORD_RESET_BUILD_PARAM ? (flag as T) : null)
    });

    container.register(SelfHostedAuthPasswordResetSchema);

    const builder = createBuilder();
    await container.resolve(CoreGraphQLSchemaFactory).execute(builder);

    return builder;
};

const resolverPaths = (builder: ReturnType<typeof createBuilder>) => {
    return builder.addResolver.mock.calls.map(call => call[0].path);
};

describe("password reset schema", () => {
    it("adds both mutations when the flag is not set", async () => {
        const builder = await buildSchema(null);

        expect(resolverPaths(builder)).toEqual([
            "Mutation.selfHostedAuthRequestPasswordReset",
            "Mutation.selfHostedAuthResetPassword"
        ]);
    });

    it("adds both mutations when the flag is on", async () => {
        const builder = await buildSchema(true);

        expect(builder.addTypeDefs).toHaveBeenCalledOnce();
        expect(builder.addResolver).toHaveBeenCalledTimes(2);
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
