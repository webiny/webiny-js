import React from "react";
import Draggable from "./Draggable";
import tryRenderingPlugin from "./../../utils/tryRenderingPlugin";
import {
    activateElementMutation,
    disableDraggingMutation,
    elementByIdSelector,
    enableDraggingMutation,
    getElementProps,
    highlightElementMutation,
    uiAtom,
    unHighlightElementMutation
} from "@webiny/app-page-builder/editor/recoil/modules";
import { Transition } from "react-transition-group";
import { plugins } from "@webiny/plugins";
import { renderPlugins } from "@webiny/app/plugins";
import { useRecoilState, useRecoilValue } from "recoil";
import { PbEditorPageElementPlugin, PbElement } from "@webiny/app-page-builder/types";
import {
    defaultStyle,
    ElementContainer,
    transitionStyles,
    typeStyle
} from "./Element/ElementStyled";

export type ElementPropsType = {
    id: string;
    className?: string;
};

const getElementPlugin = (element: PbElement): PbEditorPageElementPlugin => {
    if (!element) {
        return null;
    }

    const pluginsByType = plugins.byType<PbEditorPageElementPlugin>("pb-editor-page-element");
    return pluginsByType.find(pl => pl.elementType === element.type);
};

const ElementComponent: React.FunctionComponent<ElementPropsType> = ({
    id: elementId,
    className = ""
}) => {
    const element = (useRecoilValue(elementByIdSelector(elementId)) as unknown) as PbElement;
    const [uiAtomValue, setUiAtomValue] = useRecoilState(uiAtom);
    const { isActive, isHighlighted } = getElementProps(uiAtomValue, element);

    const plugin = getElementPlugin(element);

    const beginDrag = React.useCallback(() => {
        const data = { id: element.id, type: element.type, path: element.path };
        setTimeout(() => {
            setUiAtomValue(enableDraggingMutation);
        });
        return { ...data, target: plugin.target };
    }, [elementId]);

    const endDrag = React.useCallback(() => {
        setUiAtomValue(disableDraggingMutation);
    }, [elementId]);

    const onClick = React.useCallback((): void => {
        if (!element || element.type === "document" || isActive) {
            return;
        }
        setUiAtomValue(prev => activateElementMutation(prev, elementId));
    }, [elementId]);

    const onMouseEnter = React.useCallback(
        (ev): void => {
            if (!element || element.type === "document") {
                return;
            }
            ev.stopPropagation();
            if (isHighlighted) {
                return;
            }
            setUiAtomValue(prev => highlightElementMutation(prev, elementId));
        },
        [elementId]
    );
    const onMouseLeave = React.useCallback(() => {
        if (!element || element.type === "document") {
            return;
        }
        setUiAtomValue(unHighlightElementMutation);
    }, [elementId]);

    const renderDraggable = ({ drag }): JSX.Element => {
        return (
            <div ref={drag} className={"type " + typeStyle}>
                <div className="background" onClick={onClick} />
                <div className={"element-holder"} onClick={onClick}>
                    {renderPlugins("pb-editor-page-element-action", { element, plugin })}
                    <span>{plugin.elementType}</span>
                </div>
            </div>
        );
    };

    if (!plugin) {
        return null;
    }

    const renderedPlugin = tryRenderingPlugin(() =>
        plugin.render({
            element
        })
    );

    return (
        <Transition in={true} timeout={250} appear={true}>
            {state => (
                <ElementContainer
                    id={element.id}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    highlight={isHighlighted}
                    active={isActive}
                    style={{ ...defaultStyle, ...transitionStyles[state] }}
                    className={"webiny-pb-page-element-container"}
                >
                    <div className={["innerWrapper", className].filter(c => c).join(" ")}>
                        <Draggable target={plugin.target} beginDrag={beginDrag} endDrag={endDrag}>
                            {renderDraggable}
                        </Draggable>
                        {renderedPlugin}
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
export default React.memo(ElementComponent);
