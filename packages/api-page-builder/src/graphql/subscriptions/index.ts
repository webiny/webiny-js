import { ContextPlugin } from "@webiny/api";
import { afterSystemInstall } from "./afterSystemInstall";
import { PbContext } from "~/types";

export const subscriptions = (): ContextPlugin<PbContext>[] => {
    return [afterSystemInstall()];
};
