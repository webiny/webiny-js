// @flow
import React from "react";
import { get } from "lodash";

const Image = (props: *) => {
    const { src } = props.element.data;
    if (!src) {
        return null;
    }
    const attributes = get(props, "element.settings.advanced.img", {});
    return <img {...attributes} src={src} />;
};

export default Image;
