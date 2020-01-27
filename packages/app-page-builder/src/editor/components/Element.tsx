import * as React from "react";
import { Transition } from "react-transition-group";
import isEqual from "lodash/isEqual";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { useHandler } from "@webiny/app/hooks/useHandler";
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
import { PbElement, PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";
import {
    defaultStyle,
    ElementContainer,
    transitionStyles,
    typeStyle
} from "./Element/ElementStyled";

export type ElementProps = {
    className?: string;
    active: boolean;
    dragStart: Function;
    dragEnd: Function;
    element: PbElement;
    highlight: boolean;
    onClick: Function;
    onMouseOver: Function;
    renderDraggable: Function;
    beginDrag: Function;
    endDrag: Function;
    dragging: boolean;
};

const getElementPlugin = (element): PbEditorPageElementPlugin => {
    if (!element) {
        return null;
    }

    const plugins = getPlugins("pb-editor-page-element") as PbEditorPageElementPlugin[];
    return plugins.find(pl => pl.elementType === element.type);
};

const Element = (props: ElementProps) => {
    const { dragEnd, element, highlight, active, className = "" } = props;
    const plugin = getElementPlugin(element);

    const beginDrag = useHandler(props, ({ dragStart, element }) => () => {
        const data = { id: element.id, type: element.type, path: element.path };
        setTimeout(() => {
            dragStart({ element: data });
        });
        return { ...data, target: plugin.target };
    });

    const endDrag = React.useCallback(
        (props, monitor) => {
            dragEnd({ element: monitor.getItem() });
        },
        [dragEnd]
    );

    const onClick = useHandler(props, ({ element, active, activateElement }) => () => {
        if (element.type === "document") {
            return;
        }
        if (!active) {
            activateElement({ element: element.id });
        }
    });

    const onMouseOver = useHandler(props, ({ element, highlight, highlightElement }) => e => {
        if (element.type === "document") {
            return;
        }

        e.stopPropagation();
        if (!highlight) {
            highlightElement({ element: element.id });
        }
    });

    const renderDraggable = useHandler(props, ({ element }) => ({ drag }) => {
        return (
            <div ref={drag} className={"type " + typeStyle}>
                <div className="background" onClick={onClick} />
                <div className={"element-holder"} onClick={onClick}>
                    {renderPlugins("pb-editor-page-element-action", { element, plugin })}
                    <span>{plugin.elementType}</span>
                </div>
            </div>
        );
    });

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
                        <Draggable target={plugin.target} beginDrag={beginDrag} endDrag={endDrag}>
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
};

export default connect<any, any, any>(
    (state, props) => {
        return {
            ...getElementProps(state, props),
            element: getElement(state, props.id)
        };
    },
    { dragStart, dragEnd, activateElement, highlightElement },
    null,
    { areStatePropsEqual: isEqual }
)(React.memo(Element));
