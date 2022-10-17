import React, { useCallback, useMemo } from "react";
import styled from "@emotion/styled";
import { ButtonPrimary, ButtonSecondary } from "@webiny/ui/Button";
import { PbEditorElement, PbBlockVariable } from "~/types";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { Input } from "@webiny/ui/Input";
import { useCurrentBlockElement } from "~/editor/hooks/useCurrentBlockElement";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";

const FormWrapper = styled("div")({
    padding: "16px",
    display: "grid",
    rowGap: "16px"
});

const VariableSettings = ({ element }: { element: PbEditorElement }) => {
    const { block } = useCurrentBlockElement();
    const updateElement = useUpdateElement();

    const initialData = useMemo(() => {
        const variable = block?.data?.variables?.find(
            (variable: PbBlockVariable) => variable.id === element?.data?.variableId
        );

        return { label: variable?.label };
    }, [block, element]);

    const onSubmit = useCallback(
        formData => {
            if (block && block.id) {
                const newVariables = block.data?.variables?.map((variable: PbBlockVariable) => {
                    if (variable?.id === element?.data?.variableId) {
                        return {
                            ...variable,
                            label: formData.label
                        };
                    } else {
                        return variable;
                    }
                });
                updateElement({
                    ...block,
                    data: {
                        ...block.data,
                        variables: newVariables
                    }
                });
            }
        },
        [block, element]
    );

    const { showConfirmation } = useConfirmationDialog({
        title: "Remove variable",
        message: <p>Are you sure you want to remove element variable?</p>
    });

    const onRemove = useCallback(
        () =>
            showConfirmation(() => {
                if (block && block.id) {
                    const updatedVariables = block.data.variables.filter(
                        (variable: PbBlockVariable) => variable.id !== element?.data?.variableId
                    );
                    updateElement({
                        ...block,
                        data: {
                            ...block.data,
                            variables: updatedVariables
                        }
                    });

                    // element "variableId" value should be dropped
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { variableId, ...updatedElementData } = element.data;
                    updateElement({
                        ...element,
                        data: updatedElementData
                    });
                }
            }),
        [block, element]
    );

    return (
        <Form data={initialData} onSubmit={onSubmit}>
            {({ data, form, Bind }) => (
                <FormWrapper>
                    <Bind name="label" validators={validation.create("required")}>
                        <Input label="Label" />
                    </Bind>
                    <ButtonPrimary
                        disabled={data.label === initialData.label}
                        onClick={ev => {
                            form.submit(ev);
                        }}
                    >
                        Save
                    </ButtonPrimary>
                    <ButtonSecondary onClick={onRemove}>Remove Variable</ButtonSecondary>
                </FormWrapper>
            )}
        </Form>
    );
};

export default VariableSettings;
