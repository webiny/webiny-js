import { resolve } from "@webiny/api-graphql";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { GraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { createZodError } from "@webiny/utils";
import { GetMyDashboardUseCase } from "~/features/GetMyDashboard/abstractions.js";
import { SaveMyDashboardUseCase } from "~/features/SaveMyDashboard/abstractions.js";
import type { DashboardLayout } from "~/domain/types.js";
import { saveValidationSchema } from "./validation.js";

const TYPE_DEFS = /* GraphQL */ `
    type DashboardLayout {
        columns: [[String!]!]!
        hidden: [String!]!
        columnCount: Int!
    }

    input DashboardLayoutInput {
        columns: [[String!]!]!
        hidden: [String!]!
        columnCount: Int!
    }

    type DashboardError {
        code: String
        message: String!
        data: JSON
        stack: String
    }

    type DashboardLayoutResponse {
        data: DashboardLayout
        error: DashboardError
    }

    type DashboardQuery {
        # The current identity's layout, or null if it never customized its dashboard.
        getMyDashboard: DashboardLayoutResponse!
    }

    type DashboardMutation {
        saveMyDashboard(data: DashboardLayoutInput!): DashboardLayoutResponse!
    }

    extend type Query {
        dashboard: DashboardQuery
    }

    extend type Mutation {
        dashboard: DashboardMutation
    }
`;

class DashboardGraphQLSchemaImpl implements CoreGraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("api-dashboard/DashboardGraphQLSchemaImpl");

    public async execute(builder: GraphQLSchemaBuilder.Interface): CoreGraphQLSchemaFactory.Return {
        builder.addTypeDefs(TYPE_DEFS);

        builder.addResolver({
            path: "Query.dashboard",
            dependencies: [],
            resolver: () => () => ({})
        });

        builder.addResolver({
            path: "Mutation.dashboard",
            dependencies: [],
            resolver: () => () => ({})
        });

        builder.addResolver({
            path: "DashboardQuery.getMyDashboard",
            dependencies: [GetMyDashboardUseCase],
            resolver(getMyDashboard: GetMyDashboardUseCase.Interface) {
                return async () => {
                    return resolve(async () => {
                        const result = await getMyDashboard.execute();
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    });
                };
            }
        });

        builder.addResolver<{ data: DashboardLayout }>({
            path: "DashboardMutation.saveMyDashboard",
            dependencies: [SaveMyDashboardUseCase],
            resolver(saveMyDashboard: SaveMyDashboardUseCase.Interface) {
                return async ({ args }) => {
                    return resolve(async () => {
                        const validation = await saveValidationSchema.safeParseAsync(args);
                        if (!validation.success) {
                            throw createZodError(validation.error);
                        }

                        const result = await saveMyDashboard.execute(validation.data.data);
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    });
                };
            }
        });

        return builder;
    }
}

export const DashboardGraphQLSchema = CoreGraphQLSchemaFactory.createImplementation({
    implementation: DashboardGraphQLSchemaImpl,
    dependencies: []
});
