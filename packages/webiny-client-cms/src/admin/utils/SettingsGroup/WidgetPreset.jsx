import React from "react";
import _ from "lodash";
import { Component } from "webiny-client";
import { withPageEditor } from "../context/pageEditorContext";

@withPageEditor()
@Component({
    modules: ["Button", "Input", "Grid", "Dropdown", "FormGroup", "Icon", "Link", "ClickConfirm"]
})
class WidgetPreset extends React.Component {
    state = { presetName: "" };

    preset = React.createRef();

    createPreset = () => {
        if (!this.state.presetName.length) {
            return;
        }

        const { widget } = this.props;
        this.props.pageEditor.createPreset(this.state.presetName, widget.type, widget.data);
        this.setState({ presetName: "" });
    };

    beforeChange = (data, selectionChanged) => {
        const { widget, onChange } = this.props;
        if (data.type === widget.type) {
            onChange(data.data);
        } else {
            onChange({
                ...widget.data,
                style: data.data.style
            });
        }

        selectionChanged(data.id);
    };

    renderPreset = (preset, onChange) => {
        const {
            modules: { Dropdown, Link, Icon, ClickConfirm },
            deletePreset
        } = this.props;

        return (
            <Dropdown.Link key={preset.id}>
                <div style={{ position: "relative" }}>
                    <Link onClick={() => onChange(preset)}>{preset.title}</Link>
                    <div
                        style={{
                            position: "absolute",
                            right: 5,
                            top: 1
                        }}
                    >
                        <ClickConfirm message={"Are you sure you want to delete this preset?"}>
                            {({ showConfirmation }) => (
                                <Link
                                    onClick={() => showConfirmation(() => deletePreset(preset.id))}
                                >
                                    <Icon icon={"times"} />
                                </Link>
                            )}
                        </ClickConfirm>
                    </div>
                </div>
            </Dropdown.Link>
        );
    };

    render() {
        const {
            widget,
            pageEditor: { widgetPresets },
            Bind,
            modules: { Button, Input, Grid, FormGroup, Dropdown }
        } = this.props;

        let title = "No preset";
        if (widget.data.preset) {
            title = _.find(widgetPresets, { id: widget.data.preset }).title;
        }

        return (
            <React.Fragment>
                <Grid.Row>
                    <Grid.Col all={12}>
                        <Bind beforeChange={this.beforeChange} name={"preset"}>
                            {({ value, onChange }) => (
                                <FormGroup>
                                    <Dropdown title={title} maxWidth>
                                        {widgetPresets.map(preset =>
                                            this.renderPreset(preset, onChange)
                                        )}
                                    </Dropdown>
                                </FormGroup>
                            )}
                        </Bind>
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

export default WidgetPreset;
