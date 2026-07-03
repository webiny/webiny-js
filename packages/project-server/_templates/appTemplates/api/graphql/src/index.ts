import { createHandler } from "@webiny/handler-graphql";
import { extensions } from "./extensions";

export const handler = createHandler({
    plugins: [extensions()]
});
