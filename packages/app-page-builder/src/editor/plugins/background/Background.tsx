import React, { useCallback } from "react";
import { deactivateElementMutation, uiAtom } from "@webiny/app-page-builder/editor/recoil/modules";
import { css } from "emotion";
import { useRecoilState } from "recoil";

const backgroundStyle = css({
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    minHeight: "100%"
});
const Background: React.FunctionComponent = () => {
    const [uiAtomValue, setUiAtomValue] = useRecoilState(uiAtom);
    const id = uiAtomValue.activeElement;

    const deactivateElement = useCallback(() => {
        if (!id) {
            return;
        }
        setUiAtomValue(deactivateElementMutation);
    }, [id]);
    return <div className={backgroundStyle} onClick={deactivateElement} />;
};

export default React.memo(Background);
