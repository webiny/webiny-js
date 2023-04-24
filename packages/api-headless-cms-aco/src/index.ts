import { ContextPlugin } from "@webiny/handler";
import { CmsAcoContext } from "~/types";
import { attachHeadlessCmsHooks } from "~/hooks";

export const createCmsAcoContext = () => {
    return new ContextPlugin<CmsAcoContext>(async context => {
        attachHeadlessCmsHooks(context);
    });
};
