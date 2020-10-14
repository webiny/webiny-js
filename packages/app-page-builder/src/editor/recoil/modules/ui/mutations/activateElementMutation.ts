import { useSetRecoilState } from "recoil";
import { uiAtom } from "@webiny/app-page-builder/editor/recoil/modules/ui/uiAtom";

export const activateElementMutation = (id: string) => {
    const setUiAtom = useSetRecoilState(uiAtom);

    setUiAtom(prev => ({
        ...prev,
        activeElement: id
    }));
};
