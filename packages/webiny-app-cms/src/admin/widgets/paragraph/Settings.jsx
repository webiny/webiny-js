import React, { Fragment } from "react";
import { createComponent } from "webiny-app";

class ParagraphWidgetSettings extends React.Component {
    render() {
        const { modules: { Select }, Bind } = this.props;
        return (
            <Fragment>
                <Bind>
                    <Select
                        label={"Text alignment"}
                        placeholder={"Select alignment"}
                        name={"align"}
                        options={[
                            { value: "left", label: "Left" },
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
    modules: ["Select"]
});
