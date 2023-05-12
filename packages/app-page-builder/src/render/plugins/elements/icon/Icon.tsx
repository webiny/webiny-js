import React from "react";
import { get } from "lodash";
import { css } from "emotion";
import { ElementRoot } from "../../../components/ElementRoot";
import { PbElement } from "~/types";

const center = css({ textAlign: "center" });

interface IconProps {
    element: PbElement;
}
const Icon: React.FC<IconProps> = ({ element }) => {
    const { svg = null } = get(element, "data.icon", {}) as unknown as { svg?: string };

    if (!svg) {
        return null;
    }

    return (
        <ElementRoot element={element}>
            {({ getAllClasses, elementStyle }) => (
                <div
                    style={elementStyle}
                    className={getAllClasses(
                        "webiny-pb-base-page-element-style webiny-pb-page-element-icon",
                        center
                    )}
                    dangerouslySetInnerHTML={{ __html: svg }}
                />
            )}
        </ElementRoot>
    );
};

export default Icon;
