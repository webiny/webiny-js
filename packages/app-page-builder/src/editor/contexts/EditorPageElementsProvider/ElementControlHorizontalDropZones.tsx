import React from "react";
import { useRenderer } from "@webiny/app-page-builder-elements";
import { DropElementActionEvent } from "~/editor/recoil/actions";
import Droppable, { DragObjectWithTypeWithTarget } from "~/editor/components/Droppable";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import styled from "@emotion/styled";
import {useRecoilValue} from "recoil";
import {uiAtom} from "~/editor/recoil/modules";

export const OuterOuterDiv = styled.div<{ below: boolean }>(({ below }) => ({
    height: "25px",
    width: "100%",
    position: "absolute",
    [below ? "bottom" : "top"]: 0,
    left: 0,
    zIndex: 10
}));

const InnerDiv = styled.div({
    height: 5,
    width: "100%", //"calc(100% - 50px)",
    zIndex: 10,
    borderRadius: 5,
    boxSizing: "border-box",
    display: "none"
});

interface OuterDivProps {
    isOver: boolean;
    below: boolean;
    children: React.ReactNode;
}

const OuterDiv = React.memo<OuterDivProps>(
    styled.div(
        {
            margin: 0,
            padding: 0,
            width: "100%",
            zIndex: 10,
            backgroundColor: "transparent",
            position: "absolute",
            display: "flex",
            justifyContent: "center"
        },
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

const allowedParentElementTypes = ["block", "cell"];

export const ElementControlHorizontalDropZones = () => {
    const { getElement, meta } = useRenderer();
    if (!meta.parentElement || !allowedParentElementTypes.includes(meta.parentElement.type)) {
        return null;
    }

    const { isDragging } = useRecoilValue(uiAtom);
    const element = getElement();
    const handler = useEventActionHandler();

    const { type } = element;

    const dropElementAction = (source: DragObjectWithTypeWithTarget, position: number) => {
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

    return (
        <>
            <Droppable
                isVisible={() => true}
                onDrop={source => dropElementAction(source, meta.elementIndex)}
                type={type}
            >
                {({ drop, isOver }) => (
                    <OuterOuterDiv ref={drop} below={false}>
                        <OuterDiv isOver={isOver} below={false}>
                            <InnerDiv />
                        </OuterDiv>
                    </OuterOuterDiv>
                )}
            </Droppable>
            {meta.isLastElement && (
                <Droppable
                    isVisible={() => true}
                    onDrop={source =>
                        dropElementAction(source, meta.collection?.length)
                    }
                    type={type}
                >
                    {({ drop, isOver }) => (
                        <OuterOuterDiv ref={drop} below>
                            <OuterDiv isOver={isOver} below>
                                <InnerDiv />
                            </OuterDiv>
                        </OuterOuterDiv>
                    )}
                </Droppable>
            )}
        </>
    );
};
