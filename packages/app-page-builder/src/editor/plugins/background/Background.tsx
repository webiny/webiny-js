import React, { useCallback } from "react";
import {
    deactivateElementMutation,
    uiAtom,
    unHighlightElementMutation
} from "@webiny/app-page-builder/editor/recoil/modules";
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
    const { activeElement } = uiAtomValue;

    const deactivateElement = useCallback(() => {
        if (!activeElement) {
            return;
        }
        setUiAtomValue(state => deactivateElementMutation(unHighlightElementMutation(state)));
    }, [activeElement]);
    return <div className={backgroundStyle} onClick={deactivateElement} />;
};

export default React.memo(Background);
