import React from "react";
import _ from "lodash";
import { createComponent } from "webiny-app";

class ImageWidget extends React.Component {
    render() {
        const { value } = this.props;

        const src = _.get(value, "data.image.src");

        if (!src) {
            return null;
        }

        const caption = _.get(value, "data.caption");

        return (
            <div>
                <img style={{ width: "100%" }} src={src} />
                {caption && (
                    <h5 style={{ color: "#666", textAlign: "center" }}>&quot;{caption}&quot;</h5>
                )}
            </div>
        );
    }
}

export default createComponent(ImageWidget);
