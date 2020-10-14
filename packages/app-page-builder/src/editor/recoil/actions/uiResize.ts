import { editorUiAtom } from "@webiny/app-page-builder/editor/recoil/recoil";
import { useSetRecoilState } from "recoil";

const resizeUpdateAction = (value: boolean) => {
    const setEditorUi = useSetRecoilState(editorUiAtom);

    setEditorUi(prev => ({
        ...prev,
        isResizing: value
    }));
};

export const resizeStartAction = () => {
    resizeUpdateAction(true);
};

export const resizeEndAction = () => {
    resizeUpdateAction(false);
};
