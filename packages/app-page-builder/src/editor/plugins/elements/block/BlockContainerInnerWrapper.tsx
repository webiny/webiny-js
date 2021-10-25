import React from "react";
import { useRecoilValue } from "recoil";
import kebabCase from "lodash/kebabCase";
import { PbElement } from "~/types";
import { elementByIdSelector } from "~/editor/recoil/modules";
import { ElementRoot } from "~/render/components/ElementRoot";

const BlockContainerInnerWrapper = ({ elementId, children, displayMode }) => {
    const element = (useRecoilValue(elementByIdSelector(elementId)) as unknown) as PbElement;

    return (
        <ElementRoot element={element}>
            {({ elementStyle }) => {
                // Use per-device style
                const width = elementStyle[`--${kebabCase(displayMode)}-width`];
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
