/**
 * When using Caman, we added @ts-expect-error because it does not exist in packages, but it is loaded in packages/ui/src/ImageEditor/ImageEditor.tsx:38.
 * TODO: use some other library to edit images
 */
import React from "react";
import { ReactComponent as FilterIcon } from "@webiny/icons/tune.svg";
import debounce from "lodash/debounce.js";
import { Button, Grid, IconButton, Slider, Tooltip } from "@webiny/admin-ui";
import type { ImageEditorTool } from "./types.js";

interface RenderFormState {
    values: Record<string, any>;
    processing: boolean;
}

interface RenderFormProps {
    canvas: any;
    renderApplyCancel?: () => void;
}

const sliders = [
    {
        key: "brightness",
        label: "Brightness",
        min: -100
    },
    {
        key: "vibrance",
        label: "Vibrance",
        min: -100
    },
    {
        key: "hue",
        label: "Hue",
        min: -100
    },
    {
        key: "gamma",
        label: "Gamma"
    },
    {
        key: "clip",
        label: "Clip"
    },
    {
        key: "stackBlur",
        label: "Blur"
    },
    {
        key: "contrast",
        label: "Contrast",
        min: -100
    },
    {
        key: "saturation",
        label: "Saturation",
        min: -100
    },
    {
        key: "exposure",
        label: "Exposure",
        min: -100
    },
    {
        key: "sepia",
        label: "Sepia"
    },
    {
        key: "noise",
        label: "Noise"
    },
    {
        key: "sharpen",
        label: "Sharpen"
    }
];

class RenderForm extends React.Component<RenderFormProps, RenderFormState> {
    public override state: RenderFormState = {
        processing: false,
        values: {}
    };

    public override componentDidMount() {
        this.resetFiltersValues();
    }

    private readonly applyFilters = debounce(() => {
        const { canvas } = this.props;
        const { values } = this.state;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const component = this;

        // @ts-expect-error
        Caman(canvas.current, function () {
            // @ts-expect-error
            this.revert(false);
            Object.keys(values).forEach(
                // @ts-expect-error
                key => values[key] !== 0 && this[key] && this[key](values[key])
            );
            // @ts-expect-error
            this.render();
            component.setState({ processing: false });
        });
    }, 200);

    private readonly resetFiltersValues = () => {
        this.setState(state => {
            sliders.reduce((output, current) => {
                state.values[current.key] = 0;
                return output;
            }, {});

            return state;
        });
    };

    public override render() {
        return (
            <Grid>
                <>
                    {sliders.map(props => (
                        <Grid.Column span={4} key={props.key}>
                            <Slider
                                value={Number(this.state.values[props.key])}
                                min={0}
                                max={100}
                                disabled={this.state.processing}
                                onValueChange={(value: number) => {
                                    this.setState(state => {
                                        const values = { ...state.values };
                                        values[props.key] = value;

                                        return { ...state, processing: true, values };
                                    }, this.applyFilters);
                                }}
                                {...props}
                            />
                        </Grid.Column>
                    ))}
                </>
                <Grid.Column span={12} className={"text-center"}>
                    <Button
                        text={"Reset filters"}
                        variant={"secondary"}
                        onClick={() => {
                            this.setState({ processing: true }, () => {
                                this.resetFiltersValues();
                                this.applyFilters();
                                this.setState({ processing: false });
                            });
                        }}
                    />
                </Grid.Column>
            </Grid>
        );
    }
}

const tool: ImageEditorTool = {
    name: "filter",
    icon({ activateTool }) {
        return (
            <Tooltip
                trigger={
                    <IconButton
                        variant={"ghost"}
                        icon={<FilterIcon />}
                        onClick={() => activateTool("filter")}
                        data-testid={"filter-item"}
                    />
                }
                content={"Filter"}
            />
        );
    },
    renderForm(props) {
        return <RenderForm {...props} />;
    },
    cancel: ({ canvas }) => {
        // @ts-expect-error
        Caman(canvas.current, function () {
            // @ts-expect-error
            this.revert(false);
            // @ts-expect-error
            this.render();
        });
    }
};

export default tool;
