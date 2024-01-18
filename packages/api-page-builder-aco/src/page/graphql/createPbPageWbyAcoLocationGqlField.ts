import { PbAcoContext } from "~/types";
import { Page } from "@webiny/api-page-builder/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";

export const createPbPageWbyAcoLocationGqlField = (context: PbAcoContext) => {
    context.plugins.register(
        new GraphQLSchemaPlugin<PbAcoContext>({
            typeDefs: /* GraphQL */ `
                type WbyPbAcoLocation {
                    folderId: String
                }

                extend type PbPage {
                    wbyAco_location: WbyPbAcoLocation
                }
            `,
            resolvers: {
                PbPage: {
                    wbyAco_location: async (page: Page, args, context: PbAcoContext) => {
                        const pageSearchRecord = await context.pageBuilderAco.app.search.get(
                            page.pid
                        );

                        if (pageSearchRecord && pageSearchRecord.location.folderId !== "root") {
                            return {
                                folderId: pageSearchRecord.location.folderId
                            };
                        }

                        return {
                            folderId: null
                        };
                    }
                }
            }
        })
    );
};
