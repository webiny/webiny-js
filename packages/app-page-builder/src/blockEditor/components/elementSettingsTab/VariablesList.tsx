import React from "react";
import styled from "@emotion/styled";
import { PbEditorElement, PbBlockVariable } from "~/types";
import { Typography } from "@webiny/ui/Typography";
import {
    useSortableList,
    useMoveVariable
} from "~/blockEditor/components/elementSettingsTab/variablesListHooks";
import { Collapsable } from "~/editor/plugins/toolbar/navigator/StyledComponents";
import { ReactComponent as DragIndicatorIcon } from "~/editor/plugins/toolbar/navigator/assets/drag_indicator_24px.svg";

const TitleWrapper = styled("div")({
    padding: "16px",
    textAlign: "center"
});

const VariableItem = styled("div")({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px",
    borderTop: "1px solid var(--mdc-theme-background)",

    "&:hover": {
        backgroundColor: "var(--mdc-theme-background)",
        color: "var(--mdc-theme-primary)"
    },

    "&>svg": {
        cursor: "move"
    }
});

interface GetHighlightItemPropsParams {
    dropItemAbove?: boolean;
    isOver?: boolean;
    elementType: string;
}

const getHighlightItemProps = ({
    dropItemAbove,
    isOver,
    elementType
}: GetHighlightItemPropsParams) => {
    if (!isOver || elementType !== "variable") {
        return {
            top: false,
            bottom: false
        };
    }
    if (dropItemAbove) {
        return {
            top: true,
            bottom: false
        };
    }
    return {
        top: false,
        bottom: true
    };
};

const VariablesListItem = ({
    variable,
    index,
    move
}: {
    variable: PbBlockVariable;
    index: number;
    move: (current: number, next: number) => void;
}) => {
    const {
        ref: dragAndDropRef,
        handlerId,
        isOver,
        dropItemAbove
    } = useSortableList({
        move,
        id: variable.varRef,
        index,
        type: "variable"
    });

    const highlightItem = getHighlightItemProps({
        isOver,
        dropItemAbove,
        elementType: "variable"
    });

    return (
        <Collapsable ref={dragAndDropRef} data-handler-id={handlerId} highlightItem={highlightItem}>
            <VariableItem>
                {variable?.label}
                <DragIndicatorIcon />
            </VariableItem>
        </Collapsable>
    );
};

const VariablesList = ({ element }: { element: PbEditorElement }) => {
    const { move } = useMoveVariable(element);

    return (
        <>
            <TitleWrapper>
                <Typography use="headline6">Block variables</Typography>
            </TitleWrapper>
            {element?.data?.variables?.map((variable: PbBlockVariable, index: number) => (
                <VariablesListItem key={index} index={index} variable={variable} move={move} />
            ))}
        </>
    );
};

export default VariablesList;
