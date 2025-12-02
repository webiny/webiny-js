import { createAbstraction } from "@webiny/feature/api";
import type { Reply as IReply } from "~/types.js";

export const Reply = createAbstraction<IReply>("Reply");

export namespace Reply {
    export type Interface = IReply;
}
