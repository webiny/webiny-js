import React from "react";
import { inject } from "webiny-client";

@inject({
    modules: ["Select", "IconPicker", "Grid"]
})
class TextWidgetSettings extends React.Component {
    render() {
        const {
            modules: { Select, IconPicker, Grid },
            Bind
        } = this.props;
        return (
            <React.Fragment>
                <Grid.Row>
                    <Grid.Col all={6}>
                        <Bind name={"icon"}>
                            <IconPicker label={"Icon"} />
                        </Bind>
                    </Grid.Col>
                    <Grid.Col all={6}>
                        <Bind name={"iconSize"}>
                            <Select
                                label={"Icon size"}
                                placeholder={"Select size"}
                                options={[
                                    { value: "xs", label: "Extra small" },
                                    { value: "sm", label: "Small" },
                                    { value: "lg", label: "Large" },
                                    { value: "2x", label: "2x" },
                                    { value: "3x", label: "3x" },
                                    { value: "5x", label: "5x" },
                                    { value: "7x", label: "7x" },
                                    { value: "10x", label: "10x" }
                                ]} />
                        </Bind>
                    </Grid.Col>
                </Grid.Row>
            </React.Fragment>
        );
    }
}

export default TextWidgetSettings;
