import { uiAtom } from "../uiAtom";
import { useSetRecoilState } from "recoil";

const resizeUpdateAction = (value: boolean) => {
    const setUiAtomValue = useSetRecoilState(uiAtom);

    setUiAtomValue(prev => ({
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
