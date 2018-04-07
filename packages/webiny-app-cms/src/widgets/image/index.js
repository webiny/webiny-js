import React from "react";
import Widget from "./widget";

export default {
    type: "image",
    render(props) {
        return <Widget {...props} />;
    }
};
