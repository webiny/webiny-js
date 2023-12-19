import React, { useMemo } from "react";
import styled from "@emotion/styled";

import Draggable, { BeginDragProps } from "~/admin/components/FormEditor/Draggable";
import { FbFormStep } from "~/types";
import { RowContainer } from "./Styled";
import { Horizontal } from "~/admin/components/FormEditor/DropZone";
import { useEditTab } from "./EditFieldDialog/useEditTab";

import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/outlined/add_circle_outline.svg";
import { EditTabStepRow } from "./EditTabStepRow";

const AddStepBtn = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 25px;
    text-transform: uppercase;
    cursor: pointer;
`;

const RowContainerWrapper = styled.div`
    & .css-1uf2zda-RowContainer {
        &:last-child {
            margin-bottom: 25px !important;
        }
    }
`;

const StyledRowContainer = styled(RowContainer)<{ isDragging: boolean }>`
    opacity: ${({ isDragging }) => (isDragging ? 0.3 : 1)};
    border: none;
    box-shadow: none;
    margin-bottom: 20px;
    padding: 10px;

    &:last-child {
        margin-bottom: 25px !important;
    }
`;

interface EditTabStepProps {
    setIsEditStep: (params: { isOpened: boolean; id: string }) => void;
    formStep: FbFormStep;
    index: number;
}

const AddStepButton = ({
    addStepButtonVisible,
    addStep
}: {
    addStepButtonVisible: boolean;
    addStep: () => void;
}) => {
    return addStepButtonVisible ? (
        <AddStepBtn onClick={addStep} data-testid="add-step-action">
            <IconButton icon={<AddIcon />} />
            Add new step
        </AddStepBtn>
    ) : null;
};

export const EditTabStep = ({ setIsEditStep, formStep, index }: EditTabStepProps) => {
    const { handleStepMove, renderTopDropZone, renderBottomDropZone, isAddStepVisible, addStep } =
        useEditTab();

    const beginDragStepProps: BeginDragProps = useMemo(() => {
        return {
            ui: "step",
            name: "step",
            pos: { row: index, index },
            container: {
                type: "step",
                id: formStep.id
            }
        };
    }, [index, formStep]);

    const addStepButtonVisible = isAddStepVisible(formStep);

    return (
        <Draggable beginDrag={beginDragStepProps}>
            {({ drag, isDragging }) => (
                <RowContainerWrapper>
                    <StyledRowContainer isDragging={isDragging}>
                        <EditTabStepRow
                            dragRef={drag}
                            setIsEditStep={setIsEditStep}
                            formStep={formStep}
                            index={index}
                        />
                        <Horizontal
                            onDrop={item => handleStepMove(item, formStep)}
                            isVisible={item => renderTopDropZone(item, formStep.id)}
                        />
                        <Horizontal
                            last
                            onDrop={item => handleStepMove(item, formStep)}
                            isVisible={item => renderBottomDropZone(item, formStep.id)}
                        />
                    </StyledRowContainer>
                    <AddStepButton addStep={addStep} addStepButtonVisible={addStepButtonVisible} />
                </RowContainerWrapper>
            )}
        </Draggable>
    );
};
