import { InputType } from "@webiny/api-kernel-core";

import { EmptyTrashBinsInputHandler } from "./EmptyTrashBinsInputHandler.js";

export const EMPTY_TRASH_BINS_EVENT_IDENTIFIER = "WebinyEmptyTrashBins";

/**
 * Asks for the trash bins to be emptied. The standalone server dispatches it on a timer; AWS gets
 * the same from an EventBridge rule (`WebinyEmptyTrashBin`).
 */
export interface IEmptyTrashBinsEvent {
    [EMPTY_TRASH_BINS_EVENT_IDENTIFIER]: true;
}

class EmptyTrashBinsInputTypeImpl implements InputType.Interface<IEmptyTrashBinsEvent> {
    matches(input: any): input is IEmptyTrashBinsEvent {
        return input?.[EMPTY_TRASH_BINS_EVENT_IDENTIFIER] === true;
    }

    getHandlerAbstraction() {
        return EmptyTrashBinsInputHandler;
    }
}

export const EmptyTrashBinsInputType = InputType.createImplementation({
    implementation: EmptyTrashBinsInputTypeImpl,
    dependencies: []
});
