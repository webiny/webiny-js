//@flow
import * as React from "react";
import { Transition } from "react-transition-group";
import { compose, pure, withHandlers, withProps, withState } from "recompose";
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
    dragStart: Function,
    dragEnd: Function,
    element: ElementType,
    highlight: boolean,
    theme: Object,
    onClick: Function,
    onMouseOver: Function,
    openHelp: Function,
    renderDraggable: Function,
    plugin: Object,
    beginDrag: Function,
    endDrag: Function,
    dragging: boolean
};

const Element = pure(
    ({
        plugin,
        renderDraggable,
        element,
        highlight,
        active,
        theme,
        onMouseOver,
        beginDrag,
        endDrag
    }: ElementProps) => {
        if (!plugin) {
            return null;
        }
        return (
            <Transition in={true} timeout={250} appear={true}>
                {state => (
                    <ElementContainer
                        id={element.id}
                        onMouseOver={onMouseOver}
                        highlight={highlight}
                        active={active}
                        style={{ ...defaultStyle, ...transitionStyles[state] }}
                    >
                        <div className={"innerWrapper"}>
                            <Draggable
                                target={plugin.target}
                                beginDrag={beginDrag}
                                endDrag={endDrag}
                            >
                                {renderDraggable}
                            </Draggable>
                            {plugin.render({ theme, element })}
                        </div>
                    </ElementContainer>
                )}
            </Transition>
        );
    }
);

export default compose(
    connect(
        (state, props) => {
            return {
                ...getElementProps(state, props),
                element: state.elements[props.id]
            };
        },
        { dragStart, dragEnd, activateElement, highlightElement },
        null,
        {
            areStatePropsEqual: (state, prevState) => {
                return isEqual(state, prevState);
            }
        }
    ),
    withTheme(),
    withProps(({ element }) => ({
        plugin: getPlugin(element.type)
    })),
    withHandlers({
        beginDrag: ({ plugin, element, dragStart }) => () => {
            const data = { type: element.type, path: element.path };
            setTimeout(() => {
                dragStart({ element: data });
            });
            return { ...data, target: plugin.target };
        },
        endDrag: ({ dragEnd }) => (props, monitor) => {
            dragEnd({ element: monitor.getItem() });
        },
        openHelp: ({ plugin }) => () => {
            window.open(plugin.help, "_blank");
        },
        onClick: ({ element, active, activateElement }) => () => {
            if (element.type === "cms-element-document") {
                return;
            }
            if (!active) {
                activateElement({ element: element.id });
            }
        },
        onMouseOver: ({ element, highlight, highlightElement }) => e => {
            if (element.type === "cms-element-document") {
                return;
            }

            e.stopPropagation();
            if (!highlight) {
                highlightElement({ element: element.id });
            }
        }
    }),
    withHandlers({
        renderDraggable: ({ plugin, onClick, openHelp }) => ({ connectDragSource }) => {
            return connectDragSource(
                <div className={"type " + typeStyle}>
                    <div className="background" onClick={onClick} />
                    <div className={"element-holder"} onClick={onClick}>
                        {plugin.help && <HelpIcon className={"help-icon"} onClick={openHelp} />}
                        <span>
                            <SettingsIcon /> {plugin.name.replace("cms-element-", "")}
                        </span>
                    </div>
                </div>
            );
        }
    })
)(Element);
