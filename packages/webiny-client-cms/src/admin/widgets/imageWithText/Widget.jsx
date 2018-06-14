import React from "react";
import { inject } from "webiny-client";
import placeholderImage from "./placeholder.jpg";

@inject({
    modules: ["SlateEditor"]
})
class ImageWithTextWidget extends React.Component {
    render() {
        const {
            widget: { data },
            Bind,
            modules: { SlateEditor }
        } = this.props;

        const image = (
            <div
                style={{
                    flexBasis: (data.imageSize || 50) + "%",
                    padding: parseInt(data.padding) || 10
                }}
                key={"image"}
            >
                <img src={(data.image && data.image.src) || placeholderImage} width={"100%"} />
            </div>
        );

        const text = (
            <div
                style={{
                    flexBasis: 100 - (data.imageSize || 50) + "%",
                    padding: parseInt(data.padding) || 10
                }}
                key={"text"}
            >
                <Bind name={"text"}>
                    <SlateEditor />
                </Bind>
            </div>
        );

        return (
            <div style={{ display: "flex" }}>
                {data.imagePosition === "left" ? [image, text] : [text, image]}
            </div>
        );
    }
}

export default ImageWithTextWidget;
