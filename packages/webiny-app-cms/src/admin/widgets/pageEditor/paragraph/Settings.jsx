import React, { Fragment } from "react";
import { createComponent } from "webiny-app";

class ParagraphWidgetSettings extends React.Component {
    render() {
        const {
            modules: { Select, Textarea, IconPicker },
            Bind
        } = this.props;
        return (
            <Fragment>
                <Bind>
                    <IconPicker name={"icon"} label={"Icon"}/>
                </Bind>
                <Bind>
                    <Select
                        label={"Icon size"}
                        placeholder={"Select size"}
                        name={"iconSize"}
                        options={[
                            { value: "xs", label: "Extra small" },
                            { value: "sm", label: "Small" },
                            { value: "lg", label: "Large" },
                            { value: "2x", label: "2x" },
                            { value: "3x", label: "3x" },
                            { value: "5x", label: "5x" },
                            { value: "7x", label: "7x" },
                            { value: "10x", label: "10x" }
                        ]}
                    />
                </Bind>
                <Bind>
                    <Textarea name={"text"} label={"Text"} />
                </Bind>
                <Bind>
                    <Select
                        label={"Text alignment"}
                        placeholder={"Select alignment"}
                        name={"align"}
                        options={[
                            { value: "left", label: "Left" },
                            { value: "center", label: "Center" },
                            { value: "right", label: "Right" },
                            { value: "justify", label: "Justify" }
                        ]}
                    />
                </Bind>
            </Fragment>
        );
    }
}

export default createComponent(ParagraphWidgetSettings, {
    modules: ["Select", "Textarea", "IconPicker"]
});
