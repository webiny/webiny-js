import React, { Fragment } from "react";
import { createComponent } from "webiny-app";

class ImageWidgetSettings extends React.Component {
    render() {
        const { settings, Bind, modules: { Select, Input } } = this.props;
        return (
            <Fragment>
                <Bind>
                    <Select
                        label={"Image size"}
                        placeholder={"Select image size"}
                        name={"size"}
                        options={[
                            { value: "stretch", label: "Full width" },
                            { value: "fixed", label: "Fixed width" }
                        ]}
                    />
                </Bind>
                {settings.size === "fixed" && (
                    <Bind>
                        <Input
                            name="width"
                            validators="required"
                            placeholder={"Enter image width"}
                            label={"Image width"}
                        />
                    </Bind>
                )}
            </Fragment>
        );
    }
}

export default createComponent(ImageWidgetSettings, {
    modules: ["Select", "Input"]
});
