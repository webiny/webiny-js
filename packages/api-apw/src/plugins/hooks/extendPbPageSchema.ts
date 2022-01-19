import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ApwContext } from "~/types";

export default () =>
    new GraphQLSchemaPlugin<ApwContext>({
        typeDefs: /* GraphQL */ `
            type PbApwPageSettings {
                workflowId: ID
            }

            extend type PbPageSettings {
                apw: PbApwPageSettings
            }
        `
    });
