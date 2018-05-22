import React, { Fragment } from "react";
import { createComponent } from "webiny-app";

class ImageWidgetSettings extends React.Component {
    render() {
        const {
            widget,
            Bind,
            handleImage,
            modules: { Select, Input, Textarea, Image }
        } = this.props;
        return (
            <Fragment>
                <Bind>
                    <Input name={"title"} label={"Title"} />
                </Bind>
                <Bind>
                    <Select
                        label={"Heading type"}
                        placeholder={"Select heading"}
                        name={"heading"}
                        options={[
                            { value: "h1", label: "H1" },
                            { value: "h2", label: "H2" },
                            { value: "h3", label: "H3" },
                            { value: "h4", label: "H4" }
                        ]}
                    />
                </Bind>
                <Bind>
                    <Textarea name={"text"} label={"Text"} />
                </Bind>
                <Bind beforeChange={(value, onChange) => {
                    handleImage(this.props, value, onChange);
                }}>
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
                        options={[
                            { value: "left", label: "Left" },
                            { value: "right", label: "Right" }
                        ]}
                    />
                </Bind>
            </Fragment>
        );
    }
}

export default createComponent(ImageWidgetSettings, {
    modules: ["Select", "Input", "Textarea", "Image"]
});
