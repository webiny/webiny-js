import React from "react";
import get from "lodash/get";
import { css } from "emotion";
import { ElementRoot } from "~/render/components/ElementRoot";
import { PbEditorElement } from "~/types";

const center = css({ textAlign: "center" });

interface IconProps {
    element: PbEditorElement;
}
const Icon: React.FC<IconProps> = ({ element }) => {
    return (
        <ElementRoot element={element}>
            {({ getAllClasses, elementStyle }) => {
                const svg = get(element, "data.icon.svg", null);
                const className = getAllClasses(
                    "webiny-pb-base-page-element-style webiny-pb-page-element-icon",
                    center
                );

                if (!svg) {
                    return <></>;
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
