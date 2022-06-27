import { Context } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { QueueAddJob } from "~/types";

export type QueueAddJobEvent = QueueAddJob | QueueAddJob[];
export interface HandlerContext extends Context, ArgsContext<QueueAddJobEvent> {}
