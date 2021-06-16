import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { TenancyContext } from "./types";
import { Tenancy } from "./Tenancy";

export default () => {
    return new ContextPlugin<TenancyContext>(async context => {
        context.tenancy = new Tenancy(context);
        await context.tenancy.init();
    });
};
