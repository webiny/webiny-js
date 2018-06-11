import React from "react";
import { app, Component } from "webiny-app";

@Component({ modules: ["Button", "Input", "Grid", "Select", "OptionsData"] })
export default class WidgetPreset extends React.Component {
    state = { presetName: "" };

    preset = React.createRef();

    createPreset = () => {
        if (!this.state.presetName.length) {
            return;
        }

        const { widget } = this.props;
        const create = app.graphql.generateCreate("CmsWidgetPreset", "id");

        create({
            variables: {
                data: {
                    title: this.state.presetName,
                    type: widget.type,
                    data: widget.data
                }
            }
        });
    };

    render() {
        const {
            widget,
            onChange,
            modules: { Button, Input, Grid, OptionsData, Select }
        } = this.props;
        return (
            <React.Fragment>
                <Grid.Row>
                    <Grid.Col all={12}>
                        <OptionsData
                            entity={"CmsWidgetPreset"}
                            fields={"id title type data"}
                            labelField={"title"}
                            perPage={1000}
                        >
                            {({ options }) => (
                                <Select
                                    allowClear={true}
                                    selectRef={this.preset}
                                    useDataAsValue
                                    options={options}
                                    placeholder={"Select a preset"}
                                    label={"Widget preset"}
                                    value={null}
                                    onChange={preset => {
                                        if (preset.type === widget.type) {
                                            onChange(preset.data);
                                        } else {
                                            onChange({ ...widget.data, style: preset.data.style });
                                        }
                                    }}
                                />
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
