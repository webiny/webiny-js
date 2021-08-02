import { useEventActionHandler } from "../../hooks/useEventActionHandler";
import { UpdateElementActionEvent } from "../../recoil/actions";
import { UpdateElementActionArgsType } from "../../recoil/actions/updateElement/types";
import { PbEditorElement } from "../../../types";
import { useMemo } from "react";
import lodashSet from "lodash/set";
import lodashMerge from "lodash/merge";
import { useHandler } from "@webiny/app/hooks/useHandler";
export type PostModifyElementArgs = {
    name: string;
    newValue: any;
    element: PbEditorElement;
    newElement: PbEditorElement;
};
type UpdateHandlersPropsType = {
    element: PbEditorElement;
    dataNamespace: string;
    postModifyElement?: (args: PostModifyElementArgs) => void;
};
type HandlerUpdateCallableType = (name: string) => (value: any) => void;
type UseUpdateHandlersType = (props: UpdateHandlersPropsType) => {
    getUpdateValue: HandlerUpdateCallableType;
    getUpdatePreview: HandlerUpdateCallableType;
};
const useUpdateHandlers: UseUpdateHandlersType = props => {
    const handler = useEventActionHandler();
    const updateElement = (args: UpdateElementActionArgsType) => {
        handler.trigger(new UpdateElementActionEvent(args));
    };
    const updateSettings = useHandler(props, ({ element, dataNamespace, postModifyElement }) => {
        const historyUpdated = {};
        return (name: string, newValue: any, history = false) => {
            const propName = `${dataNamespace}.${name}`;

            const newElement = lodashMerge({}, element, lodashSet({}, propName, newValue));
            // post modify the element.
            if (typeof postModifyElement === "function") {
                postModifyElement({ name, newElement, element, newValue });
            }

            if (!history) {
                updateElement({
                    element: newElement,
                    history: false
                });
                return;
            }

            if (historyUpdated[propName] !== newValue) {
                historyUpdated[propName] = newValue;
                updateElement({
                    element: newElement,
                    history: true
                });
            }
        };
    });

    const getUpdateValue = useMemo(() => {
        const handlers = {};
        return (name: string) => {
            if (!handlers[name]) {
                handlers[name] = value => updateSettings(name, value, true);
            }

            return handlers[name];
        };
    }, [updateSettings]);

    const getUpdatePreview = useMemo(() => {
        const handlers = {};
        return (name: string) => {
            if (!handlers[name]) {
                handlers[name] = value => updateSettings(name, value, false);
            }

            return handlers[name];
        };
    }, [updateSettings]);

    return { getUpdateValue, getUpdatePreview };
};

export default useUpdateHandlers;
