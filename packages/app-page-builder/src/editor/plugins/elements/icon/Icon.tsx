import React from "react";
import { css } from "emotion";
import get from "lodash/get";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";

const center = css({ textAlign: "center" });

const Icon = ({ element }) => {
    return (
        <ElementRoot element={element}>
            {({ getAllClasses, elementStyle }) => {
                const svg = get(element, "data.icon.svg", null);
                const className = getAllClasses(
                    "webiny-pb-base-page-element-style webiny-pb-page-element-icon",
                    center
                );

                if (!svg) {
                    return null;
                }

                return (
                    <div
                        style={elementStyle}
                        className={className}
                        dangerouslySetInnerHTML={{ __html: svg }}
                    />
                );
            }}
        </ElementRoot>
    );
};

export default Icon;
