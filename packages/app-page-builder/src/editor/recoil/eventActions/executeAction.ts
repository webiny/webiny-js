import { PbState } from "../modules/types";
import {
    EventActionHandlerCallableArgs,
    EventActionCallable,
    EventActionHandlerActionCallableResponse,
    EventActionHandlerMeta
} from "~/types";

export const executeAction = <T extends EventActionHandlerCallableArgs = any>(
    state: PbState,
    meta: EventActionHandlerMeta,
    action: EventActionCallable<T>,
    args: T,
    previousResult?: EventActionHandlerActionCallableResponse
): Required<EventActionHandlerActionCallableResponse> => {
    const previousState = previousResult?.state || {};
    const previousActions = previousResult?.actions || [];
    const result = action(
        { ...state, ...previousState } as any,
        meta,
        args
    ) as EventActionHandlerActionCallableResponse;

    return {
        state: {
            ...previousState,
            ...result.state
        },
        actions: previousActions.concat(result.actions)
    };
};

export const executeAsyncAction = async <T extends EventActionHandlerCallableArgs = any>(
    state: PbState,
    meta: EventActionHandlerMeta,
    action: EventActionCallable<T>,
    args: T,
    previousResult?: EventActionHandlerActionCallableResponse
): Promise<EventActionHandlerActionCallableResponse> => {
    const previousState = previousResult?.state || {};
    const previousActions = previousResult?.actions || [];
    const result = await action({ ...state, ...previousState } as any, meta, args);

    return {
        state: {
            ...previousState,
            ...result.state
        },
        actions: previousActions.concat(result.actions)
    };
};
