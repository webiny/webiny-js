import React from "react";
import { css } from "emotion";
import { ElementStyle, getElementStyleProps } from "webiny-app-cms/render/components/ElementStyle";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const center = css({ textAlign: "center" });

const Icon = ({ element }) => {
    const svg = element.data.icon || null;

    return (
        <ElementStyle {...getElementStyleProps(element)}>
            {({ getAllClasses }) => {
                const className = getAllClasses("webiny-cms-element-icon", center);

                return svg ? (
                    <div className={className} dangerouslySetInnerHTML={{ __html: svg }} />
                ) : (
                    <div className={className}>
                        <FontAwesomeIcon icon={["fab", "font-awesome-flag"]} size={"4x"} />
                    </div>
                );
            }}
        </ElementStyle>
    );
};

export default Icon;
