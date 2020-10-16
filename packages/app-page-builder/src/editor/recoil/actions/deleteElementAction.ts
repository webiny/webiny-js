import { updateElementAction } from "@webiny/app-page-builder/editor/recoil/actions/updateElementAction";
import {
    deactivateElementMutation,
    elementParentWithChildrenByIdSelector
} from "@webiny/app-page-builder/editor/recoil/modules";
import { PbEditorPageElementPlugin, PbElement } from "@webiny/app-page-builder/types";
import { getPlugins } from "@webiny/plugins";
import { useRecoilValue } from "recoil";
import { useBatching } from "recoil-undo";

type DeleteElementActionType = {
    element: PbElement;
};
// packages/app-page-builder/src/editor/actions/actions.ts:195
export const deleteElementAction = ({ element }: DeleteElementActionType) => {
    // next(action);

    // store.dispatch(deactivateElement());

    const { startBatch, endBatch } = useBatching();

    startBatch();

    deactivateElementMutation();
    const parent = useRecoilValue(elementParentWithChildrenByIdSelector(element.id));

    const newElement = {
        ...parent,
        elements: parent.elements.filter(target => {
            return target.id !== element.id;
        })
    };
    updateElementAction({ element: newElement });
    // store.dispatch(updateElement({ element: newElement }));

    // Execute `onChildDeleted` if defined
    const plugins = getPlugins<PbEditorPageElementPlugin>("pb-editor-page-element");
    const plugin = plugins.find(pl => pl.elementType === newElement.type);
    if (!plugin) {
        return;
    }

    if (typeof plugin.onChildDeleted === "function") {
        plugin.onChildDeleted({ element: parent, child: element });
    }

    endBatch();
};
