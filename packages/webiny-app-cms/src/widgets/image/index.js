import React from "react";
import _ from "lodash";
import Widget from "../../utils/Widget";

class ImageWidget extends Widget {
    render(widget) {
        const src = _.get(widget, "data.image.src");

        if (!src) {
            return null;
        }

        const caption = _.get(widget, "data.caption");

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

export default ImageWidget;
