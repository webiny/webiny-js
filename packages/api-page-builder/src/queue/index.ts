import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { DbContext } from "@webiny/handler-db/types";

export type Tag = { id?: string; class?: string };
export type Args = { urls: string[]; tenant: string; locale: string };

export type RenderJob = {};

export default (): HandlerPlugin<DbContext, ArgsContext<Args>> => ({
    type: "handler",
    async handle(context) {
        const args = context.invocationArgs;

        try {
            console.log("process queue");

            return { data: {}, error: null };
        } catch (e) {
            return { data: null, error: e };
        }
    }
});
