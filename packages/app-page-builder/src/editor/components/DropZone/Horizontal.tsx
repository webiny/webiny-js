import React from "react";
import Droppable, { DroppableIsVisiblePropType, DroppableOnDropPropType } from "../Droppable";
import styled from "@emotion/styled";

const InnerDiv = styled("div")({
    height: 5,
    width: "100%", //"calc(100% - 50px)",
    zIndex: 3,
    borderRadius: 5,
    boxSizing: "border-box",
    display: "none"
});

interface OuterDiv {
    isOver: boolean;
    below: boolean;
    children: React.ReactNode;
}

const OuterDiv = React.memo<OuterDiv>(
    styled("div")(
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
        (props: OuterDiv) => ({
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

export interface HorizontalPropsType {
    type: string;
    onDrop: DroppableOnDropPropType;
    below?: boolean;
    isVisible?: DroppableIsVisiblePropType;

    /**
     * For testing purpose
     */
    "data-testid"?: string;
}

const HorizontalComponent: React.FC<HorizontalPropsType> = props => {
    const { below, onDrop, isVisible, type } = props;
    return (
        <Droppable type={type} isVisible={isVisible} onDrop={onDrop}>
            {({ isOver, drop }) => (
                <div
                    className={props["data-testid"]}
                    data-testid={props["data-testid"]}
                    ref={drop}
                    style={{
                        height: "25px",
                        width: "100%",
                        position: "absolute",
                        [below ? "bottom" : "top"]: 0,
                        left: 0,
                        zIndex: 1000
                    }}
                >
                    <OuterDiv isOver={isOver} below={below || false}>
                        <InnerDiv />
                    </OuterDiv>
                </div>
            )}
        </Droppable>
    );
};

export const Horizontal = React.memo(HorizontalComponent);
