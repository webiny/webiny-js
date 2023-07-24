import { ContextPlugin } from "@webiny/api";

export default () => [
    new ContextPlugin(ctx => {
        const a = ctx.WEBINY_VERSION + "1.0.02";
        console.log(a);
    })
];
