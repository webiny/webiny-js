// @flow
import React from "react";
import { get } from "lodash";

const Image = (props: *) => {
    const { src } = props.element.data;
    const { width, height, align, rest } = get(props, "element.settings.advanced.img", {});
    const wrapperStyle = get(props, "element.settings.style", {});

    const style = { width, height };
    if (!style.width && !style.height) {
        style.width = "100%";
        style.height = "100%";
    }

    return (
        <div style={{ ...wrapperStyle, textAlign: align }}>
            <img {...rest} style={style} src={src} />
        </div>
    );
};

export default Image;
