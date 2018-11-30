// @flow
import * as React from "react";
import { css } from "emotion";
import { ElementStyle, getElementStyleProps } from "webiny-app-cms/render/components/ElementStyle";
import ConnectedElement from "webiny-app-cms/editor/components/ConnectedElement";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const center = css({ textAlign: "center" });

const Icon = ({ element }: Object) => {
    return (
        <ElementStyle {...getElementStyleProps(element)}>
            {({ getAllClasses }) => (
                <ConnectedElement elementId={element.id}>
                    {element => {
                        const svg = element.data.icon || null;
                        const className = getAllClasses("webiny-cms-element-icon", center);

                        return svg ? (
                            <div className={className} dangerouslySetInnerHTML={{ __html: svg }} />
                        ) : (
                            <div className={className}>
                                <FontAwesomeIcon icon={["fab", "font-awesome-flag"]} size={"4x"} />
                            </div>
                        );
                    }}
                </ConnectedElement>
            )}
        </ElementStyle>
    );
};

export default Icon;
