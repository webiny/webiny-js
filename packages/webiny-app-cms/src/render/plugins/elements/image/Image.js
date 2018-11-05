// @flow
import React from "react";

const Image = (props: *) => {
    const {
        element: { data }
    } = props;
    return <img src={data.src} alt={data.alt} width={data.width} height={data.height} />;
};

export default Image;
