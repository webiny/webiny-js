import { useContext } from "react";
import { EventActionHandlerContext } from "../contexts/EventActionHandlerProvider";
import { EventActionHandler } from "~/types";

export function useEventActionHandler<
    TCallableState = unknown
>(): EventActionHandler<TCallableState> {
    return useContext<EventActionHandler<TCallableState>>(EventActionHandlerContext as any);
}
