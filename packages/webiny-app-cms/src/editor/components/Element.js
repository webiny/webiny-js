//@flow
import * as React from "react";
import styled from "react-emotion";
import { css } from "emotion";
import shortid from "shortid";
import { Transition } from "react-transition-group";
import compose from "recompose/compose";
import { connect } from "react-redux";
import { getPlugin } from "webiny-app/plugins";
import { withTheme } from "webiny-app-cms/theme";
import {
    dragStart,
    dragEnd,
    activateElement,
    highlightElement
} from "webiny-app-cms/editor/actions";
import { ReactComponent as HelpIcon } from "webiny-app-cms/editor/assets/icons/help_outline.svg";
import { ReactComponent as SettingsIcon } from "webiny-app-cms/editor/assets/icons/settings.svg";
import { getElementProps } from "webiny-app-cms/editor/selectors";
import Draggable from "./Draggable";
import type { ElementType } from "webiny-app-cms/types";

const typeStyle = css({
    position: "relative",
    cursor: "pointer",
    ".element-holder": {
        position: "absolute",
        cursor: "pointer",
        display: "flex",
        top: -20,
        boxSizing: "border-box",
        right: 0,
        fontSize: 10,
        padding: 0,
        color: "#fff",
        zIndex: 30,
        width: "auto",
        "> span": {
            borderRadius: 2,
            display: "flex",
            padding: "4px 10px",
            "> svg": {
                height: 13,
                width: 13,
                marginRight: 5
            }
        },
        "> svg": {
            borderRadius: 2,
            height: 13,
            padding: 4,
            marginRight: 5,
            "&.help-icon": {
                cursor: "pointer"
            }
        }
    }
});

const ElementContainer = styled("div")(({ highlight, active, dragged }) => {
    const color = active ? "var(--mdc-theme-primary)" : "var(--mdc-theme-secondary)";

    return {
        position: "relative",
        flex: "100%",
        padding: 0,
        opacity: dragged ? 0.3 : 1,
        borderRadius: 2,
        boxSizing: "border-box",
        transition: "all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)",
        "&::after": {
            content: "''",
            position: "absolute",
            zIndex: "-1",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            boxShadow: highlight ? "inset 0px 0px 0px 2px " + color : "none",
            transition: "all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)",
            opacity: highlight ? 1 : 0
        },
        "&:hover::after": {
            opacity: 1
        },
        "&:hover": {
            "> .innerWrapper > .type": {
                display: highlight ? "block" : "none"
            }
        },
        "> .innerWrapper": {
            width: "100%"
        },
        "> .innerWrapper > .type": {
            display: highlight ? "block" : "none",
            width: !active ? "100%" : "100px",
            height: !active ? "100%" : "25px",
            [!active ? "left" : "right"]: 0,
            position: "absolute",
            top: 0,
            zIndex: 10,
            transition: "background-color 0.2s",
            ".background": {
                pointerEvents: highlight ? "auto" : "none",
                display: !active ? "block" : "none",
                position: "absolute",
                backgroundColor: active ? "rgba(250, 87, 35, 1)" : "rgba(0, 204, 176, 0.1)",
                width: "100%",
                height: "100%",
                cursor: "pointer",
                top: 0,
                left: 0,
                transition: "background-color 0.2s"
            },
            ".element-holder": {
                "> span, > svg": {
                    backgroundColor: color
                }
            }
        }
    };
});

const defaultStyle = {
    opacity: 0,
    transform: "scale(0.5)",
    transitionProperty: "opacity, transform",
    transitionTimingFunction: "cubic-bezier(0, 0, .2, 1)",
    transitionDuration: "175ms",
    transitionDelay: "50ms",
    willChange: "opacity, transform"
};

const transitionStyles = {
    entering: { opacity: 0, transform: "scale(0.5)" },
    entered: { opacity: 1, transform: "scale(1)" }
};

declare type ElementProps = {
    active: boolean,
    activateElement: Function,
    dragStart: Function,
    dragEnd: Function,
    isResizing: boolean,
    element: ElementType,
    highlight: boolean,
    highlightElement: Function,
    theme: Object
};

declare type ElementState = {
    id: string,
    dragged: boolean,
    overlay: boolean
};

class Element extends React.Component<ElementProps, ElementState> {
    state = {
        id: shortid.generate(),
        dragged: false,
        overlay: false
    };

    _isMounted = false;

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    onClick = () => {
        if (!this.props.active) {
            this.props.activateElement({ element: this.props.element.path });
        }
    };

    onMouseOver = e => {
        e.stopPropagation();
        const { isResizing, element, highlight, highlightElement } = this.props;
        if (!isResizing && !highlight) {
            highlightElement({ element: element.id });
        }
    };

    render() {
        const { element, highlight, active, theme } = this.props;
        const plugin = getPlugin(element.type);

        if (!plugin) {
            return null;
        }

        return (
            <Transition in={true} timeout={250} appear={true}>
                {state => (
                    <ElementContainer
                        id={this.state.id}
                        onMouseOver={this.onMouseOver}
                        highlight={highlight}
                        active={active}
                        dragged={this.state.dragged}
                        style={{ ...defaultStyle, ...transitionStyles[state] }}
                    >
                        <div className={"innerWrapper"}>
                            <Draggable
                                target={plugin.target}
                                beginDrag={() => {
                                    const data = { type: element.type, path: element.path };
                                    setTimeout(() => {
                                        this.setState({ dragged: true });
                                        this.props.dragStart({ element: data });
                                    });
                                    return { ...data, target: plugin.target };
                                }}
                                endDrag={(props, monitor) => {
                                    this._isMounted && this.setState({ dragged: false });
                                    this.props.dragEnd({ element: monitor.getItem() });
                                }}
                            >
                                {({ connectDragSource }) =>
                                    connectDragSource(
                                        <div className={"type " + typeStyle}>
                                            <div className="background" onClick={this.onClick} />
                                            <div
                                                className={"element-holder"}
                                                onClick={this.onClick}
                                            >
                                                {plugin.element && plugin.element.help && (
                                                    <HelpIcon
                                                        className={"help-icon"}
                                                        onClick={() => {
                                                            window.open(
                                                                plugin.element.help,
                                                                "_blank"
                                                            );
                                                        }}
                                                    />
                                                )}
                                                <span>
                                                    <SettingsIcon />{" "}
                                                    {plugin.name.replace("cms-element-", "")}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                }
                            </Draggable>
                            {plugin.render({ theme, element })}
                        </div>
                    </ElementContainer>
                )}
            </Transition>
        );
    }
}

export default compose(
    connect(
        (state, props) => {
            return {
                ...getElementProps(state, props),
                element: props.element
            };
        },
        { dragStart, dragEnd, activateElement, highlightElement }
    ),
    withTheme()
)(Element);
