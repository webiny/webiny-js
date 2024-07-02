import React, { useCallback } from "react";
import { Transition } from "react-transition-group";
import { plugins } from "@webiny/plugins";
import { renderPlugins } from "@webiny/app/plugins";
import { PbEditorPageElementPlugin, PbEditorElement } from "~/types";
import Draggable from "./Draggable";
import tryRenderingPlugin from "../../utils/tryRenderingPlugin";
import { disableDraggingMutation, enableDraggingMutation } from "../recoil/modules";
import {
    defaultStyle,
    ElementContainer,
    transitionStyles,
    typeStyle
} from "./Element/ElementStyled";
import { DragElementWrapper, DragSourceOptions } from "react-dnd";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";
import { useUI } from "~/editor/hooks/useUI";
import { useElementById } from "~/editor/hooks/useElementById";
import { SetterOrUpdater } from "recoil";
import { ElementProvider } from "~/editor/contexts/ElementProvider";

interface RenderDraggableCallableParams {
    drag: DragElementWrapper<DragSourceOptions> | null;
}
interface RenderDraggableCallable {
    (params: RenderDraggableCallableParams): JSX.Element;
}

export interface ElementPropsType {
    id: string;
    className?: string;
    isHighlighted?: boolean;
    isActive?: boolean;
}

const getElementPlugin = (element: PbEditorElement): PbEditorPageElementPlugin | null => {
    if (!element) {
        return null;
    }

    const pluginsByType = plugins.byType<PbEditorPageElementPlugin>("pb-editor-page-element");
    return pluginsByType.find(pl => pl.elementType === element.type) || null;
};

const ElementComponent = ({ id: elementId, className = "", isActive }: ElementPropsType) => {
    // Type casting here because we're (almost) confident that there _is_ an element with this ID.
    const [element, updateElement] = useElementById(elementId) as [
        PbEditorElement,
        SetterOrUpdater<PbEditorElement>
    ];
    const [, setUi] = useUI();
    const [, setActiveElementId] = useActiveElementId();
    const { isHighlighted } = element as PbEditorElement;

    const plugin = getElementPlugin(element);

    const beginDrag = useCallback(() => {
        const data = { id: element.id, type: element.type };
        setTimeout(() => {
            setUi(enableDraggingMutation);
        });
        const target = plugin ? plugin.target : null;
        return {
            ...data,
            target
        };
    }, [elementId]);

    const endDrag = useCallback(() => {
        setUi(disableDraggingMutation);
    }, [elementId]);

    const onClick = useCallback((): void => {
        if (!element || element.type === "document" || isActive) {
            return;
        }
        setActiveElementId(elementId);
    }, [elementId, isActive]);

    const onMouseOver = useCallback(
        (ev: React.MouseEvent): void => {
            if (!element || element.type === "document") {
                return;
            }
            ev.stopPropagation();
            if (isHighlighted) {
                return;
            }
            updateElement(element => ({ ...element, isHighlighted: true }));
        },
        [elementId]
    );
    const onMouseOut = useCallback(() => {
        if (!element || element.type === "document") {
            return;
        }
        updateElement(element => ({ ...element, isHighlighted: false }));
    }, [elementId]);

    const renderDraggable: RenderDraggableCallable = ({ drag }) => {
        const pluginElementType = plugin ? plugin.elementType : "unknown";
        return (
            <div ref={drag} className={"type " + typeStyle}>
                <div className="background" onClick={onClick} />
                <div className={"element-holder"} onClick={onClick}>
                    {renderPlugins("pb-editor-page-element-action", { element, plugin })}
                    <span>{pluginElementType} | ${element.id}</span>
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
            isActive: isActive || false
        })
    );

    const isDraggable = Array.isArray(plugin.target) && plugin.target.length > 0;

    return (
        <ElementProvider element={element}>
            <Transition in={true} timeout={250} appear={true}>
                {state => (
                    <ElementContainer
                        id={element.id}
                        onMouseOver={onMouseOver}
                        onMouseOut={onMouseOut}
                        highlight={isActive ? true : isHighlighted}
                        active={isActive || false}
                        style={{ ...defaultStyle, ...transitionStyles[state] }}
                        className={"webiny-pb-page-element-container"}
                    >
                        <div className={["innerWrapper", className].filter(c => c).join(" ")}>
                            <Draggable
                                enabled={isDraggable}
                                target={plugin ? plugin.target || [] : []}
                                beginDrag={beginDrag}
                                endDrag={endDrag}
                            >
                                {renderDraggable}
                            </Draggable>

                            {renderedPlugin}
                        </div>
                    </ElementContainer>
                )}
            </Transition>
        </ElementProvider>
    );
};

const withHighlightElement = (Component: React.ComponentType<ElementPropsType>) => {
    return function withHighlightElementComponent(props: ElementPropsType) {
        const [activeElementId] = useActiveElementId();

        return <Component {...props} isActive={activeElementId === props.id} />;
    };
};

export default withHighlightElement(React.memo<any>(ElementComponent));
