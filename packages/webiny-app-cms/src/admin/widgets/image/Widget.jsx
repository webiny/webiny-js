import React from "react";
import SlateEditor from "./../slateEditor/Slate";
import placeholderImage from "./placeholder.jpg";

export default class ImageWidget extends React.Component {
    render() {
        const {
            widget: { data },
            Bind
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
                <Bind>
                    <SlateEditor name={"text"} />
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
