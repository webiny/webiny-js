import { attachManageGraphQLSchema } from "~/graphql/manage.schema";
import { ContextPlugin } from "@webiny/handler";
import { AcoContext } from "@webiny/api-aco/types";

export const createCmsGraphQLSchema = () => {
    return [
        new ContextPlugin<AcoContext>(async context => {
            await attachManageGraphQLSchema(context);
        })
    ];
};
