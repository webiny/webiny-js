import React, { Fragment } from "react";
import _ from "lodash";
import Widget from "../../utils/Widget";
import placeholderImage from "./placeholder.jpg";

class ImageWidget extends Widget {
    render({ widget: { data } }) {
        const src = _.get(data, "image.src", placeholderImage);

        const image = (
            <div style={{ flex: "50%", padding: 30 }}>
                <img style={{ width: "100%" }} src={src} />
            </div>
        );

        const text = (
            <div style={{ flex: "50%" }}>
                {React.createElement(
                    data.heading || "h1",
                    { style: { color: "#666", textAlign: "left" } },
                    data.title || "Paragraph title"
                )}
                <p>{data.text || ""}</p>
            </div>
        );

        return (
            <div style={{ display: "flex" }}>
                {data.imagePosition === "right" ? (
                    <Fragment>
                        {text} {image}
                    </Fragment>
                ) : (
                    <Fragment>
                        {image} {text}
                    </Fragment>
                )}
            </div>
        );
    }
}

export default ImageWidget;
