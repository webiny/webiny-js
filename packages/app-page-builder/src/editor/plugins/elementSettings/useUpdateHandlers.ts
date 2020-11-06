import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { UpdateElementActionArgsType } from "@webiny/app-page-builder/editor/recoil/actions/updateElement/types";
import { PbElement, PbShallowElement } from "@webiny/app-page-builder/types";
import { useMemo } from "react";
import { useApolloClient } from "react-apollo";
import lodashSet from "lodash/set";
import lodashMerge from "lodash/merge";
import { useHandler } from "@webiny/app/hooks/useHandler";

type UpdateHandlersPropsType = {
    element: PbShallowElement | PbElement;
    dataNamespace: string;
};
type HandlerUpdateCallableType = (name: string) => (value: any) => void;
type UseUpdateHandlersType = (
    props: UpdateHandlersPropsType
) => {
    getUpdateValue: HandlerUpdateCallableType;
    getUpdatePreview: HandlerUpdateCallableType;
};
const useUpdateHandlers: UseUpdateHandlersType = props => {
    const handler = useEventActionHandler();
    const apolloClient = useApolloClient();
    const updateElement = (args: UpdateElementActionArgsType) => {
        handler.trigger(new UpdateElementActionEvent(args));
    };
    const updateSettings = useHandler(props, ({ element, dataNamespace }) => {
        const historyUpdated = {};
        return (name: string, newValue: any, history = false) => {
            const propName = `${dataNamespace}.${name}`;

            const newElement = lodashMerge({}, element, lodashSet({}, propName, newValue));

            if (!history) {
                updateElement({
                    element: newElement,
                    history: false,
                    merge: true
                });
                return;
            }

            if (historyUpdated[propName] !== newValue) {
                historyUpdated[propName] = newValue;
                updateElement({
                    element: newElement,
                    merge: true,
                    history: true,
                    client: apolloClient
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
