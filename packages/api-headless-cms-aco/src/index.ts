import { ContextPlugin } from "@webiny/handler";
import { CmsAcoContext } from "~/types";
import { attachHeadlessCmsHooks } from "~/hooks";
import { createCmsGraphQLSchema } from "~/graphql";

export const createCmsAcoContext = () => {
    return [
        ...createCmsGraphQLSchema(),
        new ContextPlugin<CmsAcoContext>(async context => {
            attachHeadlessCmsHooks(context);
        })
    ];
};
