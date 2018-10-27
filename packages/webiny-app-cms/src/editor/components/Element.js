//@flow
import * as React from "react";
import shortid from "shortid";
import { Transition } from "react-transition-group";
import compose from "recompose/compose";
import { connect } from "react-redux";
import isEqual from "lodash/isEqual";
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
import { defaultStyle, ElementContainer, transitionStyles, typeStyle } from "./ElementStyled";

declare type ElementProps = {
    active: boolean,
    activateElement: Function,
    dragStart: Function,
    dragEnd: Function,
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
        const { element, highlight, highlightElement } = this.props;
        if (!highlight) {
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
                                                {plugin.help && (
                                                    <HelpIcon
                                                        className={"help-icon"}
                                                        onClick={() => {
                                                            window.open(plugin.help, "_blank");
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
        { dragStart, dragEnd, activateElement, highlightElement },
        null,
        { areStatePropsEqual: (state, prevState) => isEqual(state, prevState) }
    ),
    withTheme()
)(Element);
