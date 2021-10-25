import React from "react";
import { css } from "emotion";
import { IconButton } from "@webiny/ui/Button";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { Element as ElementType } from "@webiny/app-page-builder-elements/types";
import DropZone from "~/editor/components/DropZone";
import Element from "~/editor/components/Element";
import { DragObjectWithTypeWithTarget } from "~/editor/components/Droppable";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { DropElementActionEvent, TogglePluginActionEvent } from "~/editor/recoil/actions";
import { ReactComponent as AddCircleOutline } from "~/editor/assets/icons/baseline-add_circle-24px.svg";
import { CSSObject } from "@emotion/core";
import { PbEditorElement } from "~/types";

const addIcon = css({
    color: "var(--mdc-theme-secondary)",
    transition: "transform 0.2s",
    "&:hover": {
        transform: "scale(1.3)"
    },
    "&::before, &::after": {
        display: "none"
    }
});

interface PeBlockContainerProps {
    element: PbEditorElement;
}

const defaultBlockOuterStyles = {
    boxSizing: "border-box",
    width: "100%",
    display: "flex"
};

function getDefaultBlockInnerStyles(styles: CSSObject) {
    return {
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        width: styles.width,
        /**
         * We're swapping "justifyContent" & "alignItems" value here because
         * ".webiny-pb-layout-block" has "flex-direction: column"
         */
        justifyContent: styles.alignItems,
        alignItems: styles.justifyContent
    };
}

const PeBlockContainer: React.FC<PeBlockContainerProps> = ({ element }) => {
    const handler = useEventActionHandler();
    const { getClassNames, getElementClassNames, combineClassNames, getElementStyles } =
        usePageElements();

    const { id, path, type, elements } = element;

    const onAddClick = () => {
        handler.trigger(
            new TogglePluginActionEvent({
                name: "pb-editor-toolbar-add-element",
                params: { id, path, type }
            })
        );
    };

    const dropElementAction = (source: DragObjectWithTypeWithTarget, position: number) => {
        handler.trigger(
            new DropElementActionEvent({
                source,
                target: {
                    id,
                    type,
                    position
                }
            })
        );
    };

    const totalElements = elements.length;

    const [styles] = getElementStyles(element as ElementType);

    // Handle element visibility.
    if (styles.visibility === "hidden") {
        return null;
    }

    return (
        <pb-block-outer
            class={combineClassNames(
                getElementClassNames(element as ElementType),
                getClassNames(defaultBlockOuterStyles)
            )}
        >
            <pb-block-inner
                class={combineClassNames(getClassNames(getDefaultBlockInnerStyles(styles)))}
            >
                {totalElements === 0 && (
                    <DropZone.Center
                        id={id}
                        isHighlighted={element.isHighlighted}
                        type={type}
                        onDrop={source => dropElementAction(source, 0)}
                    >
                        <IconButton
                            className={addIcon + " addIcon"}
                            icon={<AddCircleOutline />}
                            onClick={onAddClick}
                        />
                    </DropZone.Center>
                )}
                {elements.map((childId: string, index) => (
                    <pb-block-child
                        key={childId}
                        class={getClassNames({
                            boxSizing: "border-box",
                            width: "100%",
                            position: "relative",
                            maxWidth: styles.width
                        })}
                    >
                        <DropZone.Above
                            type={type}
                            onDrop={source => dropElementAction(source, index)}
                        />
                        <Element key={childId} id={childId} />
                        {index === totalElements - 1 && (
                            <DropZone.Below
                                type={type}
                                onDrop={source => dropElementAction(source, totalElements)}
                            />
                        )}
                    </pb-block-child>
                ))}
            </pb-block-inner>
        </pb-block-outer>
    );
};

export default React.memo(PeBlockContainer);
