// @flow
import * as React from "react";
import { css } from "emotion";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import ConnectedElement from "@webiny/app-page-builder/editor/components/ConnectedElement";

const center = css({ textAlign: "center" });

const Icon = ({ element }: Object) => {
    return (
        <ElementRoot element={element}>
            {({ getAllClasses, elementStyle }) => (
                <ConnectedElement elementId={element.id}>
                    {element => {
                        const { svg = null } = element.data.icon;
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
                </ConnectedElement>
            )}
        </ElementRoot>
    );
};

export default Icon;
