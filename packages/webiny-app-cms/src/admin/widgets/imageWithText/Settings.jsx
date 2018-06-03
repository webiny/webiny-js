import React, { Fragment } from "react";
import { Component } from "webiny-app";

const ImageWithTextSettings = (props) => {
    const { Bind, handleImage, modules: { Select, Image, Input } } = props;
    return (
        <Fragment>
            <Bind
                beforeChange={(value, onChange) => {
                    handleImage(props, value, onChange);
                }}
            >
                <Image
                    name={"image"}
                    label={"Image"}
                    cropper={{
                        title: "Crop your image",
                        action: "Upload image",
                        config: {
                            closeOnClick: false,
                            autoCropArea: 0.7,
                            width: 300,
                            height: 300
                        }
                    }}
                />
            </Bind>
            <Bind>
                <Select
                    label={"Image position"}
                    placeholder={"Select position"}
                    name={"imagePosition"}
                    options={[{ value: "left", label: "Left" }, { value: "right", label: "Right" }]}
                />
            </Bind>
            <Bind>
                <Input
                    label={"Image size"}
                    placeholder={"Enter size in %"}
                    name={"imageSize"}
                />
            </Bind>
            <Bind>
                <Input
                    label={"Box padding"}
                    placeholder={"Enter padding in px"}
                    name={"padding"}
                />
            </Bind>
        </Fragment>
    );
};

export default Component({
    modules: ["Select", "Image", "Input"]
})(ImageWithTextSettings);
