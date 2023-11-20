import React, { useState } from "react";
import { Horizontal } from "../../DropZone";
import Draggable from "../../Draggable";
import { EditContainer, RowContainer } from "./Styled";
import { FormEditorFieldError, useFormEditor } from "../../Context";
import { FbFormStep } from "~/types";
import { Alert } from "@webiny/ui/Alert";
import styled from "@emotion/styled";

import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/outlined/add_circle_outline.svg";

import { FormStep } from "./FormStep/FormStep";
import { EditFormStepDialog } from "./FormStep/EditFormStepDialog";

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
        insertField,
        updateField,
        deleteField,
        data,
        errors,
        moveField,
        moveRow,
        getFieldPlugin,
        addStep,
        deleteStep,
        updateStep,
        moveStep
    } = useFormEditor();

    const [isEditStep, setIsEditStep] = useState<{ isOpened: boolean; id: string | null }>({
        isOpened: false,
        id: null
    });

    const stepTitle = data.steps.find(step => step.id === isEditStep.id)?.title || "";

    const handleStepMove = (source: any, step: FbFormStep): void => {
        const { pos, formStep } = source;

        if (pos) {
            if (pos.index === null) {
                return;
            }
        }

        moveStep({
            step,
            formStep
        });
    };

    // This function will render drop zones on the top of the step,
    // if steps are locatted above "source" ("source" step is the step that we move).
    const renderTopDropZone = (sourceStepId: string | undefined, targetStepId: string) => {
        if (!sourceStepId) {
            return false;
        }
        const stepsIds = data.steps.reduce(
            (prevVal, currVal) => [...prevVal, currVal.id],
            [] as string[]
        );

        return stepsIds.slice(0, stepsIds.indexOf(sourceStepId)).includes(targetStepId);
    };

    // This function will render drop zones on the top of the step,
    // if steps are locatted below "source" ("source" step is the step that we move).
    const renderBottomDropZone = (sourceStepId: string | undefined, targetStepId: string) => {
        if (!sourceStepId) {
            return false;
        }
        const stepsIds = data.steps.reduce(
            (prevVal, currVal) => [...prevVal, currVal.id],
            [] as string[]
        );

        return stepsIds.slice(stepsIds.indexOf(sourceStepId)).includes(targetStepId);
    };

    return (
        <EditContainer>
            <FieldErrors errors={errors} />
            {data.steps.map((formStep: FbFormStep, index: number) => (
                <Draggable
                    beginDrag={{ ui: "step", name: "step", pos: { row: index, index }, formStep }}
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
                                            setIsEditStep({
                                                isOpened: true,
                                                id: formStep.id
                                            });
                                        }}
                                        deleteStepDisabled={data.steps.length <= 1}
                                        moveRow={moveRow}
                                        moveField={moveField}
                                        getFieldPlugin={getFieldPlugin}
                                        insertField={insertField}
                                        getLayoutFields={getLayoutFields}
                                        updateField={updateField}
                                        deleteField={deleteField}
                                        data={data}
                                    />
                                </div>
                                <Horizontal
                                    onDrop={item => {
                                        handleStepMove(item, formStep);
                                        return undefined;
                                    }}
                                    isVisible={item => {
                                        return (
                                            item.ui === "step" &&
                                            renderTopDropZone(item?.formStep?.id, formStep.id)
                                        );
                                    }}
                                />
                                <Horizontal
                                    last
                                    onDrop={item => {
                                        handleStepMove(item, formStep);
                                        return undefined;
                                    }}
                                    isVisible={item => {
                                        return (
                                            item.ui === "step" &&
                                            renderBottomDropZone(item?.formStep?.id, formStep.id)
                                        );
                                    }}
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
            <EditFormStepDialog
                isEditStep={isEditStep}
                setIsEditStep={setIsEditStep}
                updateStep={updateStep}
                stepTitle={stepTitle}
            />
        </EditContainer>
    );
};
