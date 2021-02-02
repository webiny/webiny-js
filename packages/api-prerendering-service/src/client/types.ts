import { HandlerArgs as RenderHandlerArgs } from "@webiny/api-prerendering-service/render/types";
import { HandlerArgs as FlushHandlerArgs } from "@webiny/api-prerendering-service/flush/types";
import { HandlerArgs as QueueHandlerArgs } from "@webiny/api-prerendering-service/queue/add/types";

export type PrerenderingServiceClientContext = {
    prerenderingServiceClient: {
        render(args: RenderHandlerArgs): Promise<void>;
        flush(args: FlushHandlerArgs): Promise<void>;
        queue: {
            add(args: QueueHandlerArgs): Promise<void>;
            process(): Promise<void>;
        }
    };
};

export type PrerenderingServiceClientArgs = {
    handlers: {
        queue: {
            add: string;
            process: string;
        };
        render: string;
        flush: string;
    };
};
