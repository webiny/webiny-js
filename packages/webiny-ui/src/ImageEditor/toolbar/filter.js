// @flow
import React from "react";
import { ReactComponent as FilterIcon } from "./icons/filter.svg";
import { Slider } from "webiny-ui/Slider";
import type { ImageEditorTool } from "./types";
import { IconButton } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";
import "./caman.full.min";
import { debounce } from "lodash";

type State = {
    values: Object
};

type Props = {
    canvas: any,
    deactivateTool: Function
};

const applyFilter = debounce((canvas, effect) => {
    console.log("lodam");
    Caman(canvas, function() {
        this.revert(false);
        effect.bind(this)();
    });
}, 500);

class SubMenu extends React.Component<Props, State> {
    state = {
        values: {
            brightness: 0
        }
    };

    render() {
        const { canvas } = this.props;
        return (
            <React.Fragment>
                <div>
                    <Slider
                        label={"Brightness"}
                        value={this.state.values.brightness}
                        min={-100}
                        max={100}
                        onInput={value => {
                            this.setState(
                                state => {
                                    state.values.brightness = value;
                                    return state;
                                },
                                () => {
                                    setTimeout(() => {
                                        console.log(canvas.current)
                                        new Caman(canvas.current, function() {
                                            this.revert();
                                            this.brightness(value);
                                            this.render();
                                        });
                                    }, 500)

                                    /*applyFilter(canvas.current, function() {

                                        this.brightness(value).render();
                                    });*/
                                }
                            );
                        }}
                    />
                </div>
            </React.Fragment>
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
    subMenu(props) {
        return <SubMenu {...props} />;
    }
};

export default tool;
