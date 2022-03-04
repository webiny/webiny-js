import React, { useCallback } from "react";
import { useRecoilState } from "recoil";
import { css } from "emotion";
import { activeElementAtom } from "../../recoil/modules";

const backgroundStyle = css({
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    minHeight: "100%"
});

const Background: React.FC = () => {
    const [activeElement, setActiveElementAtomValue] = useRecoilState(activeElementAtom);

    const deactivateElement = useCallback(() => {
        if (!activeElement) {
            return;
        }
        setActiveElementAtomValue(null);
    }, [activeElement]);

    return <div className={backgroundStyle} onClick={deactivateElement} />;
};

export default React.memo(Background);
