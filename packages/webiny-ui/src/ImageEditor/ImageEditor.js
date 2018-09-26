// @flow
import * as React from "react";
import * as toolbar from "./toolbar";
import TuiImageEditor from "tui-image-editor";
import type { ImageEditorTool } from "./toolbar/types";
import styled from "react-emotion";
import { IconButton } from "webiny-ui/Button";

import cmsImage from "./cms.jpg";

export type ToolbarTool = "undo" | "redo" | "crop" | "flip" | "rotate" | "draw";

type Props = {
    menu: Array<ToolbarTool>,
    darkMode: boolean
};

type State = {
    tool: ?Object
};

{
    /*
                            ClearObjects
                            RemoveActiveObject
                            Shape
                            Icon
                            Text
                            Mask
                            Filter
                            */
}

const Toolbar = styled("div")({
    listStyle: "none",
    li: {
        display: "inline-block",
        padding: 5
    }
});

class ImageEditor extends React.Component<Props, State> {
    imageEditor: ?TuiImageEditor = null;

    static defaultProps = {
        menu: ["undo", "redo", "crop", "flip", "rotate", "draw"],
        darkMode: true
    };

    state = {
        tool: null
    };

    componentDidMount() {
        this.imageEditor = new TuiImageEditor(document.querySelector("#tui-image-editor"), {
            cssMaxWidth: 700,
            cssMaxHeight: 600,
            selectionStyle: {
                cornerSize: 20,
                rotatingPointOffset: 70
            }
        });

        // Load image
        this.imageEditor.loadImageFromURL(cmsImage, "My sample image");
    }

    render() {
        return (
            <React.Fragment>
                <Toolbar>
                    {this.props.menu.map(key => {
                        const tool: ImageEditorTool = toolbar[key];
                        if (!tool) {
                            return null;
                        }

                        return (
                            <li key={key}>
                                <IconButton
                                    icon={tool.icon}
                                    onClick={() => {
                                        this.setState({ tool }, () => {
                                            tool.onClick(this.imageEditor);
                                        });
                                    }}
                                />
                            </li>
                        );
                    })}
                </Toolbar>

                {this.state.tool &&
                    typeof this.state.tool.subMenu === "function" &&
                    this.state.tool.subMenu({
                        imageEditor: this.imageEditor,
                        clearTool: () => this.setState({ tool: null })
                    })}

                {/*

                        <div className="sub-menu-container" id="draw-shape-sub-menu">
                            <ul className="menu">
                                <li className="menu-item">
                                    <label>
                                        <input
                                            type="radio"
                                            name="select-shape-type"
                                            value="rect"
                                            checked="checked"
                                        />{" "}
                                        rect
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="select-shape-type"
                                            value="circle"
                                        />{" "}
                                        circle
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="select-shape-type"
                                            value="triangle"
                                        />{" "}
                                        triangle
                                    </label>
                                </li>
                                <li className="menu-item">
                                    <select name="select-color-type">
                                        <option value="fill">Fill</option>
                                        <option value="stroke">Stroke</option>
                                    </select>
                                    <label>
                                        <input type="checkbox" id="input-check-transparent" />
                                        transparent
                                    </label>
                                    <div id="tui-shape-color-picker" />
                                </li>
                                <li className="menu-item">
                                    <label className="menu-item no-pointer">
                                        Stroke width
                                        <input
                                            id="input-stroke-width-range"
                                            type="range"
                                            min="0"
                                            max="300"
                                            value="12"
                                        />
                                    </label>
                                </li>
                                <li className="menu-item close">Close</li>
                            </ul>
                        </div>
                        <div className="sub-menu-container" id="icon-sub-menu">
                            <ul className="menu">
                                <li className="menu-item">
                                    <div id="tui-icon-color-picker">Icon color</div>
                                </li>
                                <li className="menu-item border" id="btn-register-icon">
                                    Register custom icon
                                </li>
                                <li className="menu-item icon-text" data-icon-type="arrow">
                                    ➡
                                </li>
                                <li className="menu-item icon-text" data-icon-type="cancel">
                                    ✖
                                </li>
                                <li className="menu-item close">Close</li>
                            </ul>
                        </div>
                        <div className="sub-menu-container" id="text-sub-menu">
                            <ul className="menu">
                                <li className="menu-item">
                                    <div>
                                        <button className="btn-text-style" data-style-type="b">
                                            Bold
                                        </button>
                                        <button className="btn-text-style" data-style-type="i">
                                            Italic
                                        </button>
                                        <button className="btn-text-style" data-style-type="u">
                                            Underline
                                        </button>
                                    </div>
                                    <div>
                                        <button className="btn-text-style" data-style-type="l">
                                            Left
                                        </button>
                                        <button className="btn-text-style" data-style-type="c">
                                            Center
                                        </button>
                                        <button className="btn-text-style" data-style-type="r">
                                            Right
                                        </button>
                                    </div>
                                </li>
                                <li className="menu-item">
                                    <label className="no-pointer">
                                        <input
                                            id="input-font-size-range"
                                            type="range"
                                            min="10"
                                            max="100"
                                            value="10"
                                        />
                                    </label>
                                </li>
                                <li className="menu-item">
                                    <div id="tui-text-color-picker">Text color</div>
                                </li>
                                <li className="menu-item close">Close</li>
                            </ul>
                        </div>
                        <div className="sub-menu-container" id="filter-sub-menu">
                            <ul className="menu">
                                <li className="menu-item border input-wrapper">
                                    Load Mask Image
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="input-mask-image-file"
                                    />
                                </li>
                                <li className="menu-item" id="btn-apply-mask">
                                    Apply mask filter
                                </li>
                                <li className="menu-item close">Close</li>
                            </ul>
                        </div>
                        <div className="sub-menu-container" id="image-filter-sub-menu">
                            <ul className="menu">
                                <li className="menu-item align-left-top">
                                    <table>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            id="input-check-grayscale"
                                                        />
                                                        Grayscale
                                                    </label>
                                                </td>
                                                <td>
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            id="input-check-invert"
                                                        />
                                                        Invert
                                                    </label>
                                                </td>
                                                <td>
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            id="input-check-sepia"
                                                        />
                                                        Sepia
                                                    </label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            id="input-check-sepia2"
                                                        />
                                                        Sepia2
                                                    </label>
                                                </td>
                                                <td>
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            id="input-check-blur"
                                                        />
                                                        Blur
                                                    </label>
                                                </td>
                                                <td>
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            id="input-check-sharpen"
                                                        />
                                                        Sharpen
                                                    </label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            id="input-check-emboss"
                                                        />
                                                        Emboss
                                                    </label>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </li>
                                <li className="menu-item align-left-top">
                                    <p>
                                        <label>
                                            <input type="checkbox" id="input-check-remove-white" />
                                            RemoveWhite
                                        </label>
                                        <br />
                                        <label>
                                            Threshold
                                            <input
                                                className="range-narrow"
                                                id="input-range-remove-white-threshold"
                                                type="range"
                                                min="0"
                                                value="60"
                                                max="255"
                                            />
                                        </label>
                                        <br />
                                        <label>
                                            Distance
                                            <input
                                                className="range-narrow"
                                                id="input-range-remove-white-distance"
                                                type="range"
                                                min="0"
                                                value="10"
                                                max="255"
                                            />
                                        </label>
                                    </p>
                                </li>
                                <li className="menu-item align-left-top">
                                    <p>
                                        <label>
                                            <input type="checkbox" id="input-check-brightness" />
                                            Brightness
                                        </label>
                                        <br />
                                        <label>
                                            Value
                                            <input
                                                className="range-narrow"
                                                id="input-range-brightness-value"
                                                type="range"
                                                min="-255"
                                                value="100"
                                                max="255"
                                            />
                                        </label>
                                    </p>
                                </li>
                                <li className="menu-item align-left-top">
                                    <p>
                                        <label>
                                            <input type="checkbox" id="input-check-noise" />
                                            Noise
                                        </label>
                                        <br />
                                        <label>
                                            Value
                                            <input
                                                className="range-narrow"
                                                id="input-range-noise-value"
                                                type="range"
                                                min="0"
                                                value="100"
                                                max="1000"
                                            />
                                        </label>
                                    </p>
                                </li>
                                <li className="menu-item align-left-top">
                                    <p>
                                        <label>
                                            <input
                                                type="checkbox"
                                                id="input-check-gradient-transparancy"
                                            />
                                            GradientTransparency
                                        </label>
                                        <br />
                                        <label>
                                            Value
                                            <input
                                                className="range-narrow"
                                                id="input-range-gradient-transparency-value"
                                                type="range"
                                                min="0"
                                                value="100"
                                                max="255"
                                            />
                                        </label>
                                    </p>
                                </li>
                                <li className="menu-item align-left-top">
                                    <p>
                                        <label>
                                            <input type="checkbox" id="input-check-pixelate" />
                                            Pixelate
                                        </label>
                                        <br />
                                        <label>
                                            Value
                                            <input
                                                className="range-narrow"
                                                id="input-range-pixelate-value"
                                                type="range"
                                                min="2"
                                                value="4"
                                                max="20"
                                            />
                                        </label>
                                    </p>
                                </li>
                                <li className="menu-item align-left-top">
                                    <p>
                                        <label>
                                            <input type="checkbox" id="input-check-tint" />
                                            Tint
                                        </label>
                                        <br />
                                        <div id="tui-tint-color-picker" />
                                        <label>
                                            Opacity
                                            <input
                                                className="range-narrow"
                                                id="input-range-tint-opacity-value"
                                                type="range"
                                                min="0"
                                                value="1"
                                                max="1"
                                                step="0.1"
                                            />
                                        </label>
                                    </p>
                                </li>
                                <li className="menu-item align-left-top">
                                    <p>
                                        <label>
                                            <input type="checkbox" id="input-check-multiply" />
                                            Multiply
                                        </label>
                                        <div id="tui-multiply-color-picker" />
                                    </p>
                                </li>
                                <li className="menu-item align-left-top">
                                    <p>
                                        <label>
                                            <input type="checkbox" id="input-check-blend" />
                                            Blend
                                        </label>
                                        <div id="tui-blend-color-picker" />
                                        <select name="select-blend-type">
                                            <option value="add" selected>
                                                Add
                                            </option>
                                            <option value="diff">Diff</option>
                                            <option value="diff">Subtract</option>
                                            <option value="multiply">Multiply</option>
                                            <option value="screen">Screen</option>
                                            <option value="lighten">Lighten</option>
                                            <option value="darken">Darken</option>
                                        </select>
                                    </p>
                                </li>
                                <li className="menu-item align-left-top">
                                    <p>
                                        <label>
                                            <input type="checkbox" id="input-check-color-filter" />
                                            ColorFilter
                                        </label>
                                        <br />
                                        <label>
                                            Threshold
                                            <input
                                                className="range-narrow"
                                                id="input-range-color-filter-value"
                                                type="range"
                                                min="0"
                                                value="45"
                                                max="255"
                                            />
                                        </label>
                                    </p>
                                </li>
                                <li className="menu-item close">Close</li>
                            </ul>
                        </div>*/}

                <div id="tui-image-editor" style={{ height: 600 }}>
                    <canvas />
                </div>
            </React.Fragment>
        );
    }
}

export { ImageEditor };
