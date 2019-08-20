// @flow
import React from "react";
import { get } from "lodash";
import { css } from "emotion";
import { ElementRoot } from "webiny-app-page-builder/render/components/ElementRoot";

const center = css({ textAlign: "center" });

const Icon = ({ element }: Object) => {
    const { svg = null } = get(element, "data.icon", {});

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
