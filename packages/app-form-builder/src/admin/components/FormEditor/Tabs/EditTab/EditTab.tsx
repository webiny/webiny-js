import React, { useState } from "react";
import { Horizontal } from "~/admin/components/FormEditor/DropZone";
import Draggable from "~/admin/components/FormEditor/Draggable";
import { EditContainer, RowContainer } from "./Styled";
import { FormEditorFieldError, useFormEditor } from "../../Context";
import { FbFormStep, MoveStepParams } from "~/types";
import { Alert } from "@webiny/ui/Alert";
import styled from "@emotion/styled";

import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/outlined/add_circle_outline.svg";

import { FormStep } from "./FormStep/FormStep";
import { EditFormStepDialog } from "./FormStep/EditFormStepDialog/EditFormStepDialog";
import { DragObjectWithFieldInfo, IsVisibleCallableParams } from "../../Droppable";

const Block = styled("span")({
    display: "block"
});

const keyNames: Record<string, string> = {
    label: "Label",
    fieldId: "Field ID",
    helpText: "Help Text",
    placeholderText: "Placeholder Text",
    ["settings.defaultValue"]: "Default value"
};

interface FieldErrorsProps {
    errors: FormEditorFieldError[] | null;
}
interface FieldErrorProps {
    error: FormEditorFieldError;
}
const FieldError: React.FC<FieldErrorProps> = ({ error }) => {
    return (
        <>
            <Block>
                <strong>{error.label}</strong>
            </Block>
            {Object.keys(error.errors).map(key => {
                return (
                    <Block key={key}>
                        {keyNames[key] || "unknown"}: {error.errors[key]}
                    </Block>
                );
            })}
        </>
    );
};
const FieldErrors: React.FC<FieldErrorsProps> = ({ errors }) => {
    if (!errors) {
        return null;
    }
    return (
        <Alert title={"Error while saving form!"} type="warning">
            {errors.map(error => {
                return <FieldError error={error} key={`${error.fieldId}`} />;
            })}
        </Alert>
    );
};

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

export const EditTab: React.FC = () => {
    const {
        getLayoutFields,
        updateField,
        deleteField,
        data,
        errors,
        addStep,
        deleteStep,
        updateStep,
        moveStep,
        deleteConditionGroup
    } = useFormEditor();

    const [editStep, setEditStep] = useState<{
        isOpened: boolean;
        step: FbFormStep;
    }>({
        isOpened: false,
        step: {} as FbFormStep
    });

    const stepTitle = data.steps.find(step => step.id === editStep.step.id)?.title || "";

    const handleStepMove = (item: DragObjectWithFieldInfo, formStep: FbFormStep) => {
        if (item.pos) {
            if (item.pos.index === null) {
                return;
            }
        }

        const moveStepParams: MoveStepParams = {
            target: {
                containerId: item.container?.id || "",
                position: item.pos
            },
            destination: {
                containerId: formStep.id
            }
        };

        moveStep(moveStepParams);

        return undefined;
    };

    // This function will render drop zones on the top of the step,
    // if steps are locatted above "source" ("source" step is the step that we move).
    const renderTopDropZone = (item: IsVisibleCallableParams, targetStepId: string) => {
        if (item.ui !== "step") {
            return false;
        }

        if (!item.container?.id) {
            return false;
        }

        const stepsIds = data.steps.reduce(
            (prevVal, currVal) => [...prevVal, currVal.id],
            [] as string[]
        );

        return stepsIds.slice(0, stepsIds.indexOf(item.container?.id)).includes(targetStepId);
    };

    // This function will render drop zones on the top of the step,
    // if steps are locatted below "source" ("source" step is the step that we move).
    const renderBottomDropZone = (item: IsVisibleCallableParams, targetStepId: string) => {
        if (item.ui !== "step") {
            return false;
        }

        if (!item.container?.id) {
            return false;
        }

        const stepsIds = data.steps.reduce(
            (prevVal, currVal) => [...prevVal, currVal.id],
            [] as string[]
        );

        return stepsIds.slice(stepsIds.indexOf(item.container?.id)).includes(targetStepId);
    };

    return (
        <EditContainer>
            <FieldErrors errors={errors} />
            {data.steps.map((formStep: FbFormStep, index: number) => (
                <Draggable
                    beginDrag={{
                        ui: "step",
                        name: "step",
                        pos: { row: index, index },
                        container: {
                            type: "step",
                            id: formStep.id
                        }
                    }}
                    key={`step-${index}`}
                >
                    {({ drag, isDragging }) => (
                        <RowContainerWrapper>
                            <RowContainer
                                style={{
                                    opacity: isDragging ? 0.3 : 1,
                                    border: "none",
                                    boxShadow: "none",
                                    marginBottom: "20px",
                                    padding: "10px"
                                }}
                            >
                                <div ref={drag}>
                                    <FormStep
                                        key={index}
                                        formStep={formStep}
                                        title={formStep.title}
                                        onDelete={() => deleteStep(formStep.id)}
                                        onEdit={() => {
                                            setEditStep({
                                                isOpened: true,
                                                step: formStep
                                            });
                                        }}
                                        deleteStepDisabled={data.steps.length <= 1}
                                        getLayoutFields={getLayoutFields}
                                        updateField={updateField}
                                        deleteField={deleteField}
                                        deleteConditionGroup={deleteConditionGroup}
                                    />
                                </div>
                                <Horizontal
                                    onDrop={item => handleStepMove(item, formStep)}
                                    isVisible={item => renderTopDropZone(item, formStep.id)}
                                />
                                <Horizontal
                                    last
                                    onDrop={item => handleStepMove(item, formStep)}
                                    isVisible={item => renderBottomDropZone(item, formStep.id)}
                                />
                            </RowContainer>
                            {data.steps[data.steps.length - 1].id === formStep.id && (
                                <AddStepBtn onClick={addStep} data-testid="add-step-action">
                                    <IconButton icon={<AddIcon />} />
                                    Add new step
                                </AddStepBtn>
                            )}
                        </RowContainerWrapper>
                    )}
                </Draggable>
            ))}
            {editStep.isOpened && (
                <EditFormStepDialog
                    editStep={editStep}
                    setEditStep={setEditStep}
                    updateStep={updateStep}
                    stepTitle={stepTitle}
                    formData={data}
                />
            )}
        </EditContainer>
    );
};
