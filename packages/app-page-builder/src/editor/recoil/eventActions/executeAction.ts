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
        /**
         * Some value is undefined, and it creates problems for TS, but not for our action runner.
         */
        // @ts-expect-error
        { ...state, ...previousState },
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
    /**
     * Error is due to some undefined property. Action runner will handle it.
     */
    // @ts-expect-error
    const result = await action({ ...state, ...previousState }, meta, args);

    return {
        state: {
            ...previousState,
            ...result.state
        },
        actions: previousActions.concat(result.actions)
    };
};
