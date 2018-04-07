import React from "react";
import _ from "lodash";
import { createComponent } from "webiny-app";

class ImageWidget extends React.Component {
    render() {
        const { value } = this.props;

        const src = _.get(value, "data.image.src", _.get(value, "data.image.data"));
        if (!src) {
            return null;
        }

        return <img style={{ width: "100%" }} src={src} />;
    }
}


export default createComponent(ImageWidget);
