import React from "react";
import { createComponent } from "webiny-app";

class ParagraphWidgetSettings extends React.Component {
    render() {
        const {
            modules: { Select, IconPicker, Grid },
            Bind
        } = this.props;
        return (
            <React.Fragment>
                <Grid.Row>
                    <Grid.Col all={6}>
                        <Bind>
                            <IconPicker name={"icon"} label={"Icon"} />
                        </Bind>
                    </Grid.Col>
                    <Grid.Col all={6}>
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
                    </Grid.Col>
                </Grid.Row>
            </React.Fragment>
        );
    }
}

export default createComponent(ParagraphWidgetSettings, {
    modules: ["Select", "IconPicker", "Grid"]
});
