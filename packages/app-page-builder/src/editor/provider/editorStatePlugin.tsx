import React, { useEffect } from "react";
import {
    elementsAtom,
    ElementsAtomType, pageAtom,
    PageAtomType,
    PluginsAtomType,
    UiAtomType
} from "@webiny/app-page-builder/editor/recoil/modules";
import { flattenContentUtil } from "@webiny/app-page-builder/editor/recoil/utils";
import {Plugin} from "@webiny/plugins/types";
import { SetterOrUpdater, useRecoilValue, useSetRecoilState } from "recoil";

type StatePluginType = {
    elements?: ElementsAtomType;
    plugins?: PluginsAtomType;
    page?: PageAtomType;
    ui?: UiAtomType;
};
type EditorStatePluginActionType = {
    ui: UiAtomType;
    setUi: SetterOrUpdater<UiAtomType>;
    plugins: PluginsAtomType;
    setPlugins: SetterOrUpdater<PluginsAtomType>;
    page: PageAtomType;
    setPage: SetterOrUpdater<PageAtomType>;
    elements: ElementsAtomType;
    setElements: SetterOrUpdater<ElementsAtomType>;
    isFirstRun: boolean;
};
export type EditorStatePluginType = Plugin & {
    type: "pb-editor-state-action",
    stateAction: (props: EditorStatePluginActionType) => void;
};
const plugin: EditorStatePluginType = {
    type: "pb-editor-state-action",
    name: "pb-editor-state-flatten-content-elements",
    stateAction: ({page, setElements, isFirstRun}) => {
        console.log("1 IS RUNNING");
        if (isFirstRun === true) {
            console.log("1 YES IT IS FIRST RUN");
            return;
        }
        console.log("1 IT IS NOT FIRST RUN");
        setElements(flattenContentUtil(page.content));
    },
};

export default plugin;