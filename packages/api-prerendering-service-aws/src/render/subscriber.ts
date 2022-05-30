import { EventBridgeEvent } from "aws-lambda";
import SqsClient, { SendMessageBatchRequestEntry } from "aws-sdk/clients/sqs";
import lodashChunk from "lodash/chunk";

import {
    Args,
    PrerenderingServiceStorageOperations,
    RenderPagesEvent
} from "@webiny/api-prerendering-service/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { Context, HandlerPlugin as DefaultHandlerPlugin } from "@webiny/handler/types";

export type HandlerArgs = EventBridgeEvent<"RenderPages", RenderPagesEvent>;

export interface HandlerContext extends Context, ArgsContext<HandlerArgs> {
    //
}

export interface HandlerConfig {
    storageOperations: PrerenderingServiceStorageOperations;
    sqsQueueUrl: string;
}

export type HandlerPlugin = DefaultHandlerPlugin<HandlerContext>;

export default (params: HandlerConfig): HandlerPlugin => {
    const { storageOperations } = params;
    const sqsClient = new SqsClient();

    return {
        type: "handler",
        async handle(context) {
            if (context.invocationArgs["detail-type"] !== "RenderPages") {
                return;
            }

            const event = context.invocationArgs.detail;
            const namespace = event.configuration?.db?.namespace ?? "";
            const variant = event.variant;

            // Check if there is only specific variant rerender is requested.
            if (variant && variant !== process.env.STAGED_ROLLOUTS_VARIANT) {
                return;
            }

            const toRender = new Map<string, Args>();

            if (event.path === "*") {
                const renders = await storageOperations.listRenders({
                    where: { namespace }
                });

                for (const render of renders) {
                    if (render.args) {
                        addRender(render.args);
                    }
                }
            } else if (event.tag) {
                const renders = await storageOperations.listRenders({
                    where: {
                        namespace,
                        tag: event.tag
                    }
                });

                for (const render of renders) {
                    if (render.args) {
                        addRender(render.args);
                    }
                }
            } else {
                addRender(event);
            }

            const entries: SendMessageBatchRequestEntry[] = [];

            let i = 0;
            for (const [id, render] of toRender.entries()) {
                entries.push({
                    Id: i.toString(),
                    MessageBody: JSON.stringify(render),
                    MessageDeduplicationId: id,
                    MessageGroupId: id
                });
                i++;
            }

            // console.log(JSON.stringify([...toRender.values()]));

            const entriesChunked = lodashChunk(entries, 10);
            for (const chunk of entriesChunked) {
                const result = await sqsClient
                    .sendMessageBatch({
                        QueueUrl: params.sqsQueueUrl,
                        Entries: chunk
                    })
                    .promise();

                if (result.Failed.length) {
                    console.error("Failed to deliver some of messages");
                    console.error(JSON.stringify(result.Failed));
                }
            }

            function addRender(args: Args) {
                const namespace = args.configuration?.db?.namespace || "";
                const id = `${namespace}/${args.path}`;

                toRender.set(id, {
                    path: args.path,
                    configuration: {
                        db: args.configuration?.db,
                        meta: {
                            locale: args.configuration?.meta?.locale,
                            tenant: args.configuration?.meta?.tenant
                        }
                    }
                });
            }
        }
    };
};
