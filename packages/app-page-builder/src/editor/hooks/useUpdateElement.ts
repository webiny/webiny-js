import { useCallback } from "react";
import { PbEditorElement } from "~/types";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { UpdateElementActionEvent } from "~/editor/recoil/actions";

interface UpdateOptions {
    history: boolean;
    debounce?: boolean;
    onFinish?: () => void;
}

export const useUpdateElement = () => {
    const handler = useEventActionHandler();

    return useCallback(
        (element: PbEditorElement, options: UpdateOptions = { history: true }) => {
            handler.trigger(
                new UpdateElementActionEvent({
                    element,
                    ...options
                })
            );
        },
        [handler]
    );
};
