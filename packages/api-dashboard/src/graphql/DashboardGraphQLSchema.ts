import { resolve } from "@webiny/api-graphql";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { GraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { createZodError } from "@webiny/utils";
import { ListDashboardsUseCase } from "~/features/ListDashboards/abstractions.js";
import { UpdateDashboardUseCase } from "~/features/UpdateDashboard/abstractions.js";
import type { DashboardLayout } from "~/domain/types.js";
import { updateValidationSchema } from "./validation.js";

const TYPE_DEFS = /* GraphQL */ `
    type Dashboard {
        columns: [[String!]!]!
        hidden: [String!]!
        columnCount: Int!
    }

    input DashboardInput {
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

    type DashboardResponse {
        data: Dashboard
        error: DashboardError
    }

    type DashboardListResponse {
        data: [Dashboard!]
        error: DashboardError
    }

    type DashboardQuery {
        # The current identity's dashboards: empty until it customizes one, at most one for now.
        listDashboards: DashboardListResponse!
    }

    type DashboardMutation {
        # Creates the identity's dashboard on first use.
        updateDashboard(data: DashboardInput!): DashboardResponse!
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
            path: "DashboardQuery.listDashboards",
            dependencies: [ListDashboardsUseCase],
            resolver(listDashboards: ListDashboardsUseCase.Interface) {
                return async () => {
                    return resolve(async () => {
                        const result = await listDashboards.execute();
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    });
                };
            }
        });

        builder.addResolver<{ data: DashboardLayout }>({
            path: "DashboardMutation.updateDashboard",
            dependencies: [UpdateDashboardUseCase],
            resolver(updateDashboard: UpdateDashboardUseCase.Interface) {
                return async ({ args }) => {
                    return resolve(async () => {
                        const validation = await updateValidationSchema.safeParseAsync(args);
                        if (!validation.success) {
                            throw createZodError(validation.error);
                        }

                        const result = await updateDashboard.execute(validation.data.data);
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
