import React from "react";
import Draggable from "./Draggable";
import tryRenderingPlugin from "./../../utils/tryRenderingPlugin";
import {
    activateElementMutation,
    disableDraggingMutation,
    elementByIdSelector,
    enableDraggingMutation,
    getElementProps,
    uiAtom,
    highlightElementAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import { Transition } from "react-transition-group";
import { plugins } from "@webiny/plugins";
import { renderPlugins } from "@webiny/app/plugins";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { PbEditorPageElementPlugin, PbElement } from "@webiny/app-page-builder/types";
import {
    defaultStyle,
    ElementContainer,
    transitionStyles,
    typeStyle
} from "./Element/ElementStyled";

const withHighlightElement = (Component: React.FunctionComponent) => {
    return function withHighlightElementComponent(props) {
        const highlightElementAtomValue = useRecoilValue(highlightElementAtom);

        return (
            <Component
                {...props}
                highlightElementId={
                    highlightElementAtomValue === props.id ? highlightElementAtomValue : null
                }
            />
        );
    };
};

export type ElementPropsType = {
    id: string;
    className?: string;
    highlightElementId: string | null;
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
    className = "",
    highlightElementId
}) => {
    const element = (useRecoilValue(elementByIdSelector(elementId)) as unknown) as PbElement;
    const [uiAtomValue, setUiAtomValue] = useRecoilState(uiAtom);
    const setHighlightElementAtomValue = useSetRecoilState(highlightElementAtom);
    const { isActive, isHighlighted } = getElementProps(highlightElementId, uiAtomValue, element);

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
    }, [elementId, isActive]);

    const onMouseOver = React.useCallback(
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
    const onMouseOut = React.useCallback(() => {
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
            element
        })
    );

    return (
        <Transition in={true} timeout={250} appear={true}>
            {state => (
                <ElementContainer
                    id={element.id}
                    onMouseOver={onMouseOver}
                    onMouseOut={onMouseOut}
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
                </ElementContainer>
            )}
        </Transition>
    );
};

export default withHighlightElement(React.memo<any>(ElementComponent));
