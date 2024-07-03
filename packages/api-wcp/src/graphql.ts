import { WcpContext } from "./types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";

const emptyResolver = () => ({});

export const createWcpGraphQL = () => {
    return new GraphQLSchemaPlugin<WcpContext>({
        typeDefs: /* GraphQL */ `
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
        `,
        resolvers: {
            Query: {
                wcp: process.a.s
            },
            WcpQuery: {
                getProject: (_, __, context) => {
                    try {
                        const projectEnvironment = context.wcp.getProjectEnvironment();
                        if (!projectEnvironment) {
                            return new Response(null);
                        }

                        // We only return the project if we've managed to retrieve its license.
                        const projectLicense = context.wcp.getProjectLicense();
                        if (!projectLicense) {
                            return new Response(null);
                        }

                        return new Response({
                            orgId: projectLicense.orgId,
                            projectId: projectLicense.projectId,
                            package: projectLicense.package
                        });
                    } catch (e) {
                        return new ErrorResponse({
                            code: "COULD_NOT_GET_PROJECT",
                            message: e.message,
                            data: null,
                            stack: e.stack
                        });
                    }
                }
            }
        }
    });
};
