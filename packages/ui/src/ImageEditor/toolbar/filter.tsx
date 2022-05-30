/**
 * When using Caman, we added @ts-ignore because it does not exist in packages, but it is loaded in packages/ui/src/ImageEditor/ImageEditor.tsx:38.
 * TODO: use some other library to edit images
 */
import React from "react";
import { ReactComponent as FilterIcon } from "./icons/filter.svg";
import { Slider } from "~/Slider";
import { ImageEditorTool } from "./types";
import { IconButton, ButtonDefault } from "~/Button";
import { Tooltip } from "~/Tooltip";
import { debounce } from "lodash";
import styled from "@emotion/styled";

interface RenderFormState {
    values: Record<string, any>;
    processing: boolean;
}

interface RenderFormProps {
    canvas: any;
    renderApplyCancel?: Function;
}

const Wrapper = styled("div")({
    ul: {
        textAlign: "center",
        li: {
            display: "inline-block",
            width: 180,
            padding: 10
        }
    },
    ".buttons": {
        textAlign: "center"
    }
});

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

        // @ts-ignore
        Caman(canvas.current, function () {
            // @ts-ignore
            this.revert(false);
            Object.keys(values).forEach(
                // @ts-ignore
                key => values[key] !== 0 && this[key] && this[key](values[key])
            );
            // @ts-ignore
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
            <Wrapper>
                <ul>
                    {sliders.map(props => (
                        <li key={props.key}>
                            <Slider
                                value={this.state.values[props.key]}
                                min={0}
                                max={100}
                                disabled={this.state.processing}
                                onInput={(value: string) => {
                                    this.setState(state => {
                                        const values = { ...state.values };
                                        values[props.key] = value;

                                        return { ...state, processing: true, values };
                                    }, this.applyFilters);
                                }}
                                {...props}
                            />
                        </li>
                    ))}
                </ul>

                <div style={{ textAlign: "center" }}>
                    <ButtonDefault
                        onClick={() => {
                            this.setState({ processing: true }, () => {
                                this.resetFiltersValues();
                                this.applyFilters();
                                this.setState({ processing: false });
                            });
                        }}
                    >
                        Reset filters
                    </ButtonDefault>
                </div>
            </Wrapper>
        );
    }
}

const tool: ImageEditorTool = {
    name: "filter",
    icon({ activateTool }) {
        return (
            <Tooltip placement={"bottom"} content={"Filter"}>
                <IconButton
                    icon={<FilterIcon />}
                    onClick={() => activateTool("filter")}
                    data-testid={"filter-item"}
                />
            </Tooltip>
        );
    },
    renderForm(props) {
        return <RenderForm {...props} />;
    },
    cancel: ({ canvas }) => {
        // @ts-ignore
        Caman(canvas.current, function () {
            // @ts-ignore
            this.revert(false);
            // @ts-ignore
            this.render();
        });
    }
};

export default tool;
