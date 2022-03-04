import React, { CSSProperties } from "react";
import { useRecoilValue } from "recoil";
import kebabCase from "lodash/kebabCase";
import { PbElement } from "~/types";
import { elementByIdSelector } from "../../../recoil/modules";
import { ElementRoot } from "~/render/components/ElementRoot";

interface BlockContainerInnerWrapperProps {
    elementId: string;
    displayMode: string;
}
const BlockContainerInnerWrapper: React.FC<BlockContainerInnerWrapperProps> = ({
    elementId,
    children,
    displayMode
}) => {
    const element = useRecoilValue(elementByIdSelector(elementId)) as unknown as PbElement;

    return (
        <ElementRoot element={element}>
            {({ elementStyle }) => {
                // Use per-device style
                const width =
                    elementStyle[
                        `--${kebabCase(displayMode)}-width` as unknown as keyof CSSProperties
                    ];
                return (
                    <div
                        key={elementId}
                        style={{ position: "relative", width: "100%", maxWidth: width }}
                    >
                        {children}
                    </div>
                );
            }}
        </ElementRoot>
    );
};

export default BlockContainerInnerWrapper;
