import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import { WcpContext } from "~/features/wcp/WcpContext/index.js";

export const addWcpSchema = (builder: IGraphQLSchemaBuilder): void => {
    builder.addTypeDefs(/* GraphQL */ `
        type WcpProjectPackageFeaturesFeature {
            enabled: Boolean
            options: JSON
        }

        type WcpProjectPackageFeatures {
            seats: WcpProjectPackageFeaturesFeature
            multiTenancy: WcpProjectPackageFeaturesFeature
            advancedPublishingWorkflow: WcpProjectPackageFeaturesFeature
            advancedAccessControlLayer: WcpProjectPackageFeaturesFeature
            auditLogs: WcpProjectPackageFeaturesFeature
            recordLocking: WcpProjectPackageFeaturesFeature
            fileManager: WcpProjectPackageFeaturesFeature
            aiPowerups: WcpProjectPackageFeaturesFeature
        }

        type WcpProjectPackage {
            features: WcpProjectPackageFeatures
        }

        type WcpProject {
            orgId: ID
            projectId: ID
            package: WcpProjectPackage
        }

        type WcpError {
            code: String
            message: String
            data: JSON
            stack: String
        }

        type WcpProjectResponse {
            data: WcpProject
            error: WcpError
        }

        type WcpQuery {
            getProject: WcpProjectResponse
        }

        type WcpMutation {
            updateProject: WcpProjectResponse
        }

        extend type Query {
            wcp: WcpQuery
        }

        extend type Mutation {
            wcp: WcpMutation
        }
    `);

    builder.addResolver({
        path: "Query.wcp",
        resolver: () => async () => ({})
    });

    builder.addResolver({
        path: "WcpQuery.getProject",
        dependencies: [WcpContext],
        resolver: (wcpContext: WcpContext.Interface) => async () => {
            try {
                const project = wcpContext.getProjectWithFeatureFlags();

                if (!project) {
                    throw Error(`Could not get project!`);
                }

                return new Response(project);
            } catch (e) {
                return new ErrorResponse({
                    code: "COULD_NOT_GET_PROJECT",
                    message: e.message,
                    data: null,
                    stack: e.stack
                });
            }
        }
    });
};
