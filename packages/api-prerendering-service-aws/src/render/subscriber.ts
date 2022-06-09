import { EventBridgeEvent } from "aws-lambda";
import SqsClient, { SendMessageBatchRequestEntry } from "aws-sdk/clients/sqs";
import lodashChunk from "lodash/chunk";
import { nanoid } from "nanoid";

import {
    Args,
    PrerenderingServiceStorageOperations,
    RenderPagesEvent
} from "@webiny/api-prerendering-service/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { Context } from "@webiny/handler/types";
import { HandlerPlugin } from "@webiny/handler";

export type HandlerArgs = EventBridgeEvent<"RenderPages", RenderPagesEvent>;

export interface HandlerContext extends Context, ArgsContext<HandlerArgs> {
    //
}

export interface HandlerConfig {
    storageOperations: PrerenderingServiceStorageOperations;
    sqsQueueUrl: string;
}

export default (params: HandlerConfig) => {
    const { storageOperations } = params;
    const sqsClient = new SqsClient();

    return new HandlerPlugin<HandlerContext>(async context => {
        if (context.invocationArgs["detail-type"] !== "RenderPages") {
            return;
        }

        const event = context.invocationArgs.detail;
        const namespace = event.configuration?.db?.namespace ?? "";
        const variant = event.variant;

        // Check if a specific variant rerender is requested.
        if (variant && variant !== process.env.STAGED_ROLLOUTS_VARIANT) {
            return;
        }

        const toRender: Array<{ groupId: string; body: Args }> = [];

        // Event might contain specific paths to exclude from full rerender.
        const exclude = event.exclude || [];

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

        for (const item of toRender) {
            const messageId = nanoid(8);

            entries.push({
                // A batch entry ID can only contain alphanumeric characters, hyphens and underscores.
                Id: messageId,
                // MessageBody is a string, so we stringify the payload.
                MessageBody: JSON.stringify(item.body),
                // We're using the same unique ID as the message itself. For now, we don't want to deduplicate anything.
                MessageDeduplicationId: messageId,
                // We're grouping messages using the DB namespace, which looks like this: `T#root` (group by tenant).
                MessageGroupId: item.groupId
            });
        }

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
            if (args.path && exclude.includes(args.path)) {
                return;
            }

            const namespace = args.configuration?.db?.namespace || "";

            /**
             * We're only sending the data that comes from the business logic. Things like CDN URLs, S3 buckets, etc.
             * are all injected into the appropriate Lambda functions at deploy time, so that information is detached from
             * the database. This way we are sure that we don't store obsolete infrastructure information.
             */
            toRender.push({
                groupId: namespace,
                body: args
            });
        }
    });
};
