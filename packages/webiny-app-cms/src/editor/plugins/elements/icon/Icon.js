import React from "react";
import ElementStyle from "webiny-app-cms/render/components/ElementStyle";

const Icon = ({ theme, element }) => {
    const svg = element.data.icon || null;

    return (
        <ElementStyle element={element}>
            {svg ? <span dangerouslySetInnerHTML={{ __html: svg }} /> : "Select an icon"}
        </ElementStyle>
    );
};

export default Icon;
