import { flow } from "lodash";
import { withUser } from "@webiny/api-security";
import { withStorage, withCrudLogs, withSoftDelete, withFields } from "@webiny/commodo";
import cmsContent from "./models/cmsContent.model";
import { GraphQLBeforeSchemaPlugin, GraphQLContextPlugin } from "@webiny/api/types";

export default () => {
    function apply(context) {
        const driver = context.commodo && context.commodo.driver;

        if (!driver) {
            throw Error(
                `Commodo driver is not configured! Make sure you add a Commodo driver plugin to your service.`
            );
        }

        const createBase = () =>
            flow(
                withFields({
                    id: context.commodo.fields.id()
                }),
                withStorage({ driver }),
                withUser(context),
                withSoftDelete(),
                withCrudLogs()
            )();

        context.models = {
            CmsContentModel: cmsContent({ createBase })
        };
    }

    return [
        {
            name: "before-schema-cms-models",
            type: "before-schema",
            apply(context) {
                return apply(context);
            }
        } as GraphQLBeforeSchemaPlugin,
        {
            name: "graphql-context-cms-models",
            type: "graphql-context",
            apply(context) {
                return apply(context);
            }
        } as GraphQLContextPlugin
    ];
};
