import React, { useCallback } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { Transition } from "react-transition-group";
import { plugins } from "@webiny/plugins";
import { renderPlugins } from "@webiny/app/plugins";
import { PbEditorPageElementPlugin, PbEditorElement } from "@webiny/app-page-builder/types";
import Draggable from "./Draggable";
import tryRenderingPlugin from "../../utils/tryRenderingPlugin";
import {
    disableDraggingMutation,
    elementByIdSelector,
    enableDraggingMutation,
    uiAtom,
    highlightElementAtom,
    activeElementAtom
} from "../recoil/modules";
import {
    defaultStyle,
    ElementContainer,
    transitionStyles,
    typeStyle
} from "./Element/ElementStyled";

export type ElementPropsType = {
    id: string;
    className?: string;
    isHighlighted: boolean;
    isActive: boolean;
};

const getElementPlugin = (element: PbEditorElement): PbEditorPageElementPlugin => {
    if (!element) {
        return null;
    }

    const pluginsByType = plugins.byType<PbEditorPageElementPlugin>("pb-editor-page-element");
    return pluginsByType.find(pl => pl.elementType === element.type);
};

const ElementComponent: React.FunctionComponent<ElementPropsType> = ({
    id: elementId,
    className = "",
    isHighlighted,
    isActive
}) => {
    const element = useRecoilValue(elementByIdSelector(elementId));
    const setUiAtomValue = useSetRecoilState(uiAtom);
    const setHighlightElementAtomValue = useSetRecoilState(highlightElementAtom);
    const setActiveElementAtomValue = useSetRecoilState(activeElementAtom);

    const plugin = getElementPlugin(element);

    const beginDrag = useCallback(() => {
        const data = { id: element.id, type: element.type };
        setTimeout(() => {
            setUiAtomValue(enableDraggingMutation);
        });
        return { ...data, target: plugin.target };
    }, [elementId]);

    const endDrag = useCallback(() => {
        setUiAtomValue(disableDraggingMutation);
    }, [elementId]);

    const onClick = useCallback((): void => {
        if (!element || element.type === "document" || isActive) {
            return;
        }
        setActiveElementAtomValue(elementId);
    }, [elementId, isActive]);

    const onMouseOver = useCallback(
        (ev): void => {
            if (!element || element.type === "document") {
                return;
            }
            ev.stopPropagation();
            if (isHighlighted) {
                return;
            }
            setHighlightElementAtomValue(elementId);
        },
        [elementId]
    );
    const onMouseOut = useCallback(() => {
        if (!element || element.type === "document") {
            return;
        }
        setHighlightElementAtomValue(null);
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
            element,
            isHighlighted,
            isActive
        })
    );

    return (
        <Transition in={true} timeout={250} appear={true}>
            {state => (
                <ElementContainer
                    id={element.id}
                    onMouseOver={onMouseOver}
                    onMouseOut={onMouseOut}
                    highlight={isActive ? true : isHighlighted}
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
                </ElementContainer>
            )}
        </Transition>
    );
};

const withHighlightElement = (Component: React.FunctionComponent) => {
    return function withHighlightElementComponent(props) {
        const highlightElementAtomValue = useRecoilValue(highlightElementAtom);
        const activeElementAtomValue = useRecoilValue(activeElementAtom);

        return (
            <Component
                {...props}
                isHighlighted={highlightElementAtomValue === props.id}
                isActive={activeElementAtomValue === props.id}
            />
        );
    };
};

export default withHighlightElement(React.memo<any>(ElementComponent));
