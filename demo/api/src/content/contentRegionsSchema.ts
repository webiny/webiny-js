import { ErrorResponse, GraphQLSchemaPlugin, Response } from "@webiny/handler-graphql";
import { Context } from "../types";
import { GetApplicableContentRegions } from "../useCases/GetApplicableContentRegions";
import { createContentRegionsTypeDefs } from "./createContentRegionsTypeDefs";
import { GetCompanyById } from "../useCases/GetCompanyById";
import { GetEmployeeFromIdentity } from "../useCases/GetEmployeeFromIdentity";

export const createContentRegionsSchema = () => {
    const contentRegions = new GraphQLSchemaPlugin<Context>({
        typeDefs: createContentRegionsTypeDefs(),
        resolvers: {
            DemoQuery: {
                /**
                 * This resolver will filter content using company rules (culture groups, exclusion lists, regions).
                 */
                async getContentRegions(_, args, context) {
                    try {
                        return context.security.withoutAuthorization(async () => {
                            const useCase = new GetApplicableContentRegions(context);
                            const regions = await useCase.execute();

                            return new Response(regions);
                        });
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                async getCompany(_, args, context) {
                    try {
                        const identity = context.security.getIdentity();
                        if (identity.type === "admin") {
                            return new Response({
                                id: "previw",
                                name: "Preview",
                                logo: ""
                            });
                        }
                        // NOTE: this assumes current identity is an "employee"!
                        return context.security.withoutAuthorization(async () => {
                            const getEmployee = new GetEmployeeFromIdentity(context);
                            const employee = await getEmployee.execute();

                            const getCompany = new GetCompanyById(context);
                            const company = await getCompany.execute(employee.company.id);

                            return new Response({
                                id: company.id,
                                name: company.name,
                                logo: company.brandSettings.logo
                            });
                        });
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            }
        }
    });
    contentRegions.name = "demo.graphql.contentRegions";
    return [contentRegions];
};
