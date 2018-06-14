import React, { Fragment } from "react";
import { Component } from "webiny-client";

const ImageWithTextSettings = (props) => {
    const { Bind, handleImage, modules: { Select, Image, Input } } = props;
    return (
        <Fragment>
            <Bind
                beforeChange={(value, onChange) => {
                    handleImage(props, value, onChange);
                }}
                name={"image"}>
                <Image
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
                    }} />
            </Bind>
            <Bind name={"imagePosition"}>
                <Select
                    label={"Image position"}
                    placeholder={"Select position"}
                    options={[{ value: "left", label: "Left" }, { value: "right", label: "Right" }]} />
            </Bind>
            <Bind name={"imageSize"}>
                <Input label={"Image size"} placeholder={"Enter size in %"} />
            </Bind>
            <Bind name={"padding"}>
                <Input label={"Box padding"} placeholder={"Enter padding in px"} />
            </Bind>
        </Fragment>
    );
};

export default Component({
    modules: ["Select", "Image", "Input"]
})(ImageWithTextSettings);
