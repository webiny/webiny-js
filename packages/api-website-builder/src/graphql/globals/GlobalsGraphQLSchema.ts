import { ErrorResponse, Response } from "@webiny/api-graphql";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { GraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { globalsTypeDefs } from "~/graphql/globals/globals.typeDefs.js";
import { GetGlobalComponentUseCase } from "~/features/globals/GetGlobalComponent/index.js";
import { ListGlobalComponentsUseCase } from "~/features/globals/ListGlobalComponents/index.js";
import { SaveGlobalComponentUseCase } from "~/features/globals/SaveGlobalComponent/index.js";

interface GetGlobalComponentArgs {
    name: string;
    language?: string | null;
}

interface ListGlobalComponentsArgs {
    language?: string | null;
    fallback?: boolean | null;
}

interface SaveGlobalComponentArgs {
    name: string;
    language?: string | null;
    data: Omit<SaveGlobalComponentUseCase.Input, "name" | "language">;
}

// The use cases authorize every operation: anonymous identities lack the page permissions.
class Schema implements CoreGraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("api-website-builder/GlobalsGraphQLSchema");

    public async execute(builder: GraphQLSchemaBuilder.Interface): CoreGraphQLSchemaFactory.Return {
        builder.addTypeDefs(globalsTypeDefs);

        // An omitted language is "default": the language of pages without one.
        builder.addResolver<GetGlobalComponentArgs>({
            dependencies: [GetGlobalComponentUseCase],
            path: "WbQuery.getGlobalComponent",
            resolver(getGlobalComponent: GetGlobalComponentUseCase.Interface) {
                return async ({ args }) => {
                    const result = await getGlobalComponent.execute({
                        name: args.name,
                        language: args.language ?? null
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<ListGlobalComponentsArgs>({
            dependencies: [ListGlobalComponentsUseCase],
            path: "WbQuery.listGlobalComponents",
            resolver(listGlobalComponents: ListGlobalComponentsUseCase.Interface) {
                return async ({ args }) => {
                    const result = await listGlobalComponents.execute({
                        language: args.language ?? null,
                        fallback: args.fallback === true
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<SaveGlobalComponentArgs>({
            dependencies: [SaveGlobalComponentUseCase],
            path: "WbMutation.saveGlobalComponent",
            resolver(saveGlobalComponent: SaveGlobalComponentUseCase.Interface) {
                return async ({ args }) => {
                    const { name, language, data } = args;
                    const result = await saveGlobalComponent.execute({
                        name,
                        language: language ?? null,
                        elements: data.elements,
                        bindings: data.bindings
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                };
            }
        });

        return builder;
    }
}

export const GlobalsGraphQLSchema = CoreGraphQLSchemaFactory.createImplementation({
    implementation: Schema,
    dependencies: []
});
