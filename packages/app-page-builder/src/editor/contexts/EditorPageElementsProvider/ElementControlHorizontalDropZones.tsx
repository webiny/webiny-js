import React from "react";
import { useRenderer } from "@webiny/app-page-builder-elements";
import { DropElementActionEvent } from "~/editor/recoil/actions";
import Droppable, { DragObjectWithTypeWithTarget } from "~/editor/components/Droppable";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import styled from "@emotion/styled";
import { useRecoilValue } from "recoil";
import { uiAtom } from "~/editor/recoil/modules";
import { useSnackbar } from "@webiny/app-admin";
import { getElementTitle } from "~/editor/contexts/EditorPageElementsProvider/getElementTitle";

interface WrapperDroppableProps {
    below: boolean;
    zIndex: number;
}

export const WrapperDroppable = styled.div<WrapperDroppableProps>(({ below, zIndex }) => ({
    height: "10px",
    width: "100%",
    position: "absolute",
    [below ? "bottom" : "top"]: 0,
    left: 0,
    zIndex: zIndex
}));

interface InnerDivProps {
    zIndex: number;
}

const InnerDiv = styled.div<InnerDivProps>(({ zIndex }) => ({
    height: 5,
    width: "100%", //"calc(100% - 50px)",
    zIndex: zIndex,
    borderRadius: 5,
    boxSizing: "border-box",
    display: "none"
}));

interface OuterDivProps {
    isOver: boolean;
    below: boolean;
    zIndex: number;
    children: React.ReactNode;
}

const OuterDiv = React.memo<OuterDivProps>(
    styled.div(
        ({ zIndex }) => ({
            margin: 0,
            padding: 0,
            width: "100%",
            zIndex,
            backgroundColor: "transparent",
            position: "absolute",
            display: "flex",
            justifyContent: "center"
        }),
        (props: OuterDivProps) => ({
            [props.below ? "bottom" : "top"]: 0,
            [InnerDiv as unknown as string]: {
                backgroundColor: props.isOver
                    ? "var(--mdc-theme-primary)"
                    : "var(--mdc-theme-secondary)",
                display: props.isOver ? "block" : "none"
            }
        })
    )
);

export const ElementControlHorizontalDropZones = () => {
    const { getElement, meta } = useRenderer();
    const { isDragging } = useRecoilValue(uiAtom);
    const element = getElement();
    const handler = useEventActionHandler();
    const { showSnackbar } = useSnackbar();

    const { type } = element;

    const dropElementAction = (source: DragObjectWithTypeWithTarget, position: number) => {
        const { target } = source;

        // If the `target` property of the dragged element's plugin is an array, we want to
        // check if the dragged element can be dropped into the target element (the element
        // for which this drop zone is rendered).
        if (Array.isArray(target) && target.length > 0) {
            if (!target.includes(meta.parentElement.type)) {
                const sourceTitle = getElementTitle(source.type);
                const targetTitle = getElementTitle(meta.parentElement.type);
                showSnackbar(`${sourceTitle} cannot be dropped into ${targetTitle}.`);
                return;
            }
        }

        handler.trigger(
            new DropElementActionEvent({
                source,
                target: {
                    id: meta.parentElement.id,
                    type: meta.parentElement.type,
                    position
                }
            })
        );
    };

    if (!isDragging) {
        return null;
    }

    // Z-index of element controls overlay depends on the depth of the page element.
    // The deeper the page element is in the content hierarchy, the greater the index.
    const zIndex = meta.depth * 10 * 2;

    return (
        <>
            <Droppable
                isVisible={() => true}
                onDrop={source => dropElementAction(source, meta.elementIndex)}
                type={type}
            >
                {({ drop, isOver }) => (
                    <WrapperDroppable ref={drop} below={false} zIndex={zIndex}>
                        <OuterDiv isOver={isOver} below={false} zIndex={zIndex}>
                            <InnerDiv zIndex={zIndex} />
                        </OuterDiv>
                    </WrapperDroppable>
                )}
            </Droppable>
            {meta.isLastElement && (
                <Droppable
                    isVisible={() => true}
                    onDrop={source => dropElementAction(source, meta.elementIndex + 1)}
                    type={type}
                >
                    {({ drop, isOver }) => (
                        <WrapperDroppable ref={drop} below zIndex={zIndex}>
                            <OuterDiv isOver={isOver} below zIndex={zIndex}>
                                <InnerDiv zIndex={zIndex} />
                            </OuterDiv>
                        </WrapperDroppable>
                    )}
                </Droppable>
            )}
        </>
    );
};
