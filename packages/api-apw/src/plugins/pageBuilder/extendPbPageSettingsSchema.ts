import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ApwContext } from "~/types";

export const extendPbPageSettingsSchema = () =>
    new GraphQLSchemaPlugin<ApwContext>({
        typeDefs: /* GraphQL */ `
            type PbApwPageSettings {
                workflowId: ID
                contentReviewId: ID
            }

            extend type PbPageSettings {
                apw: PbApwPageSettings
            }
        `
    });
