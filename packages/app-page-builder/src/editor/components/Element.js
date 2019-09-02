//@flow
import * as React from "react";
import { Transition } from "react-transition-group";
import { connect } from "@webiny/app-page-builder/editor/redux";
import isEqual from "lodash/isEqual";
import { getPlugins } from "@webiny/plugins";
import { renderPlugins } from "@webiny/app/plugins";
import {
    dragStart,
    dragEnd,
    activateElement,
    highlightElement
} from "@webiny/app-page-builder/editor/actions";
import { getElementProps, getElement } from "@webiny/app-page-builder/editor/selectors";
import Draggable from "./Draggable";
import type { PbElementType } from "@webiny/app-page-builder/types";
import {
    defaultStyle,
    ElementContainer,
    transitionStyles,
    typeStyle
} from "./Element/ElementStyled";

declare type ElementProps = {
    className?: string,
    active: boolean,
    dragStart: Function,
    dragEnd: Function,
    element: PbElementType,
    highlight: boolean,
    onClick: Function,
    onMouseOver: Function,
    renderDraggable: Function,
    plugin: Object,
    beginDrag: Function,
    endDrag: Function,
    dragging: boolean
};

const getElementPlugin = element => {
    if (!element) {
        return null;
    }
    return getPlugins("pb-page-element").find(pl => pl.elementType === element.type);
};

const Element = React.memo(
    ({
        dragStart,
        dragEnd,
        activateElement,
        element,
        highlight,
        highlightElement,
        active,
        className = ""
    }: ElementProps) => {
        const plugin = getElementPlugin(element);

        const beginDrag = React.useCallback(() => {
            const data = { id: element.id, type: element.type, path: element.path };
            setTimeout(() => {
                dragStart({ element: data });
            });
            return { ...data, target: plugin.target };
        }, [element]);

        const endDrag = React.useCallback(
            (props, monitor) => {
                dragEnd({ element: monitor.getItem() });
            },
            [dragEnd]
        );

        const onClick = React.useCallback(() => {
            if (element.type === "document") {
                return;
            }
            if (!active) {
                activateElement({ element: element.id });
            }
        }, [element, active]);

        const onMouseOver = React.useCallback(
            e => {
                if (element.type === "document") {
                    return;
                }

                e.stopPropagation();
                if (!highlight) {
                    highlightElement({ element: element.id });
                }
            },
            [element, highlight]
        );

        const renderDraggable = React.useCallback(
            ({ connectDragSource }) => {
                return connectDragSource(
                    <div className={"type " + typeStyle}>
                        <div className="background" onClick={onClick} />
                        <div className={"element-holder"} onClick={onClick}>
                            {renderPlugins("pb-page-element-action", { element, plugin })}
                            <span>{plugin.name.replace("pb-page-element-", "")}</span>
                        </div>
                    </div>
                );
            },
            [element, onClick]
        );

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
                        className={"webiny-pb-page-element-container"}
                    >
                        <div className={["innerWrapper", className].filter(c => c).join(" ")}>
                            <Draggable
                                target={plugin.target}
                                beginDrag={beginDrag}
                                endDrag={endDrag}
                            >
                                {renderDraggable}
                            </Draggable>
                            {plugin.render({ element })}
                        </div>
                        {/*
                        <div className="add-element add-element--above">+</div>
                        <div className="add-element add-element--below">+</div>
                        */}
                    </ElementContainer>
                )}
            </Transition>
        );
    }
);

export default connect(
    (state, props) => {
        return {
            ...getElementProps(state, props),
            element: getElement(state, props.id)
        };
    },
    { dragStart, dragEnd, activateElement, highlightElement },
    null,
    { areStatePropsEqual: isEqual }
)(Element);
