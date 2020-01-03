import React from "react";
import { ReactComponent as FilterIcon } from "./icons/filter.svg";
import { Slider } from "@webiny/ui/Slider";
import { ImageEditorTool } from "./types";
import { IconButton, ButtonDefault } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { debounce } from "lodash";
import styled from "@emotion/styled";

type State = {
    values: Object;
    processing: boolean;
};

type Props = {
    canvas: any;
    renderApplyCancel: Function;
};

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

class RenderForm extends React.Component<Props, State> {
    state = {
        processing: false,
        values: {}
    };

    componentDidMount() {
        this.resetFiltersValues();
    }

    applyFilters = debounce(() => {
        const { canvas } = this.props;
        const { values } = this.state;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const component = this;
        Caman(canvas.current, function() {
            this.revert(false);
            Object.keys(values).forEach(
                key => values[key] !== 0 && this[key] && this[key](values[key])
            );
            this.render();
            component.setState({ processing: false });
        });
    }, 200);

    resetFiltersValues = () => {
        this.setState(state => {
            sliders.reduce((output, current) => {
                state.values[current.key] = 0;
                return output;
            }, {});

            return state;
        });
    };

    render() {
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
                                onInput={value => {
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
                <IconButton icon={<FilterIcon />} onClick={activateTool} />
            </Tooltip>
        );
    },
    renderForm(props) {
        return <RenderForm {...props} />;
    },
    cancel: ({ canvas }) => {
        Caman(canvas.current, function() {
            this.revert(false);
            this.render();
        });
    }
};

export default tool;
