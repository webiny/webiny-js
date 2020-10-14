import React from "react";
import Draggable from "./Draggable";
import tryRenderingPlugin from "./../../utils/tryRenderingPlugin";
import {
    elementByIdSelector,
    elementPropsByIdSelector,
    uiAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import { Transition } from "react-transition-group";
import { getPlugins } from "@webiny/plugins";
import { renderPlugins } from "@webiny/app/plugins";
import { useRecoilValue, useSetRecoilState } from "recoil";
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

const getElementPlugin = (element): PbEditorPageElementPlugin => {
    if (!element) {
        return null;
    }

    const plugins = getPlugins<PbEditorPageElementPlugin>("pb-editor-page-element");
    return plugins.find(pl => pl.elementType === element.type);
};

const ElementComponent: React.FunctionComponent<ElementPropsType> = props => {
    const { id: elementId, className = "" } = props;

    // TODO find a way to fix
    // expected value is PbShallowElement but plugins is looking for PbElement
    // when looking at https://github.com/webiny/webiny-js/blob/master/packages/app-page-builder/src/editor/components/Element.tsx#L137
    // it is noticeable that getElement returns shallow element from state.elements
    // when type is really PbShallowElement element - TS is complaining
    const element = (useRecoilValue(elementByIdSelector(elementId)) as unknown) as PbElement;
    const { isActive, isHighlighted } = useRecoilValue(elementPropsByIdSelector(elementId));
    const setEditorUi = useSetRecoilState(uiAtom);

    const plugin = getElementPlugin(element);

    const beginDrag = React.useCallback(() => {
        const data = { id: element.id, type: element.type, path: element.path };
        setTimeout(() => {
            setEditorUi(prev => ({
                ...prev,
                isDragging: true
            }));
        });
        return { ...data, target: plugin.target };
    }, [elementId]);

    const endDrag = React.useCallback(() => {
        setEditorUi(prev => ({
            ...prev,
            isDragging: false
        }));
    }, [elementId]);

    const onClick = React.useCallback((): void => {
        if (element.type === "document" || isActive) {
            return;
        }
        setEditorUi(prev => ({
            ...prev,
            activeElement: elementId
        }));
    }, [elementId]);

    const onMouseOver = React.useCallback(
        (ev): void => {
            if (element.type === "document") {
                return;
            }
            ev.stopPropagation();
            if (isHighlighted) {
                return;
            }
            setEditorUi(prev => ({
                ...prev,
                highlightElement: elementId
            }));
        },
        [elementId]
    );

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

    const renderedPlugin = tryRenderingPlugin(() => plugin.render({ element }));

    return (
        <Transition in={true} timeout={250} appear={true}>
            {state => (
                <ElementContainer
                    id={element.id}
                    onMouseOver={onMouseOver}
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
