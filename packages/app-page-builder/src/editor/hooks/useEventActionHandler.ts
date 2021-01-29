import { useContext } from "react";
import { EventActionHandlerContext } from "../contexts/EventActionHandlerProvider";
import { EventActionHandler } from "@webiny/app-page-builder/types";

export const useEventActionHandler = (): EventActionHandler => {
    return useContext<EventActionHandler>(EventActionHandlerContext as any);
};
