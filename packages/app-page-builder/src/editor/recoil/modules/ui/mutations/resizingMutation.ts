import { uiAtom } from "../uiAtom";
import { useSetRecoilState } from "recoil";

const updateResizeValue = (value: boolean) => {
    const setUiAtomValue = useSetRecoilState(uiAtom);

    setUiAtomValue(prev => ({
        ...prev,
        isResizing: value
    }));
};

export const startResizeMutation = () => {
    updateResizeValue(true);
};

export const endResizeMutation = () => {
    updateResizeValue(false);
};
