import { PbElement, PbShallowElement } from "@webiny/app-page-builder/types";
import React from "react";
import {
    deactivateElementMutation,
    uiAtom,
    unHighlightElementMutation
} from "@webiny/app-page-builder/editor/recoil/modules";
import { withActiveElement } from "@webiny/app-page-builder/editor/components";
import { css } from "emotion";
import { useSetRecoilState } from "recoil";

const backgroundStyle = css({
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    minHeight: "100%"
});
type BackgroundPropsType = {
    element: PbElement | PbShallowElement;
};
const Background: React.FunctionComponent<BackgroundPropsType> = ({ element }) => {
    const setUiAtomValue = useSetRecoilState(uiAtom);

    const deactivateElement = () => {
        if (!element) {
            return;
        }
        setUiAtomValue(deactivateElementMutation);
    };
    // const unHighlightElement = () => {
    //     setUiAtomValue(unHighlightElementMutation);
    // };
    return (
        <div
            className={backgroundStyle}
            // onMouseOver={() => unHighlightElement()}
            onClick={() => deactivateElement}
        />
    );
};

const BackgroundMemoized = React.memo(Background);

export default withActiveElement()(BackgroundMemoized);
