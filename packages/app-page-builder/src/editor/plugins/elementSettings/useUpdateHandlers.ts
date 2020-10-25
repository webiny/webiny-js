import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { PbElement, PbShallowElement } from "@webiny/app-page-builder/types";
import { useMemo } from "react";
import { set } from "lodash";
import { useHandler } from "@webiny/app/hooks/useHandler";

type UpdateHandlersPropsType = {
    element: PbShallowElement | PbElement;
    dataNamespace: string;
};
type UpdateElementCallableArgsType = {
    targetElement: PbShallowElement | PbElement;
    merge: boolean;
    history?: boolean;
};
type UpdateElementCallableType = (props: UpdateElementCallableArgsType) => void;
export default (props: UpdateHandlersPropsType) => {
    const handler = useEventActionHandler();
    const updateElement: UpdateElementCallableType = ({ targetElement, merge, history }) => {
        handler.trigger(
            new UpdateElementActionEvent({
                element: targetElement as PbElement,
                history,
                merge
            })
        );
    };
    const updateSettings = useHandler(props, ({ element, dataNamespace }) => {
        const historyUpdated = {};
        return (name: string, newValue: any, history = false) => {
            const propName = `${dataNamespace}.${name}`;

            const newElement = set(element, propName, newValue);

            if (!history) {
                updateElement({
                    targetElement: newElement,
                    history,
                    merge: true
                });
                return;
            }

            if (historyUpdated[propName] !== newValue) {
                historyUpdated[propName] = newValue;
                updateElement({ targetElement: newElement, merge: true });
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
