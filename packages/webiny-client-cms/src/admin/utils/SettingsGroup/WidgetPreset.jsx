import React from "react";
import { app, Component } from "webiny-client";
import { withPageEditor } from "../context/pageEditorContext";

@withPageEditor()
@Component({ modules: ["Button", "Input", "Grid", "Select", "OptionsData"] })
export default class WidgetPreset extends React.Component {
    state = { presetName: "" };

    preset = React.createRef();

    createPreset = () => {
        if (!this.state.presetName.length) {
            return;
        }

        const { widget } = this.props;
        this.props.pageEditor.createPreset(this.state.presetName, widget.type, widget.data);
    };

    render() {
        const {
            widget,
            pageEditor: { widgetPresets },
            onChange,
            Bind,
            modules: { Button, Input, Grid, OptionsData, Select }
        } = this.props;
        
        return (
            <React.Fragment>
                <Grid.Row>
                    <Grid.Col all={12}>
                        <OptionsData
                            data={widgetPresets}
                            fields={"id title type data"}
                            labelField={"title"}
                        >
                            {({ options }) => (
                                <Bind
                                    beforeChange={(data, selectionChanged) => {
                                        if (data.type === widget.type) {
                                            onChange(data.data);
                                        } else {
                                            onChange({
                                                ...widget.data,
                                                style: data.data.style
                                            });
                                        }

                                        selectionChanged(id);
                                    }}
                                >
                                    <Select
                                        name={"preset"}
                                        useDataAsValue
                                        options={options}
                                        placeholder={"Select a preset"}
                                        label={"Widget preset"}
                                    />
                                </Bind>
                            )}
                        </OptionsData>
                    </Grid.Col>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Col all={9}>
                        <Input
                            placeholder={"New preset name"}
                            value={this.state.presetName}
                            onChange={value => this.setState({ presetName: value })}
                        />
                    </Grid.Col>
                    <Grid.Col all={3}>
                        <Button onClick={this.createPreset} type={"primary"}>
                            Save
                        </Button>
                    </Grid.Col>
                </Grid.Row>
            </React.Fragment>
        );
    }
}
