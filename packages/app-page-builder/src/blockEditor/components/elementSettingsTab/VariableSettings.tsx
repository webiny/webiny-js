import React, { useCallback, useMemo } from "react";
import styled from "@emotion/styled";
import capitalize from "lodash/capitalize";
import { ButtonPrimary } from "@webiny/ui/Button";
import { ReactComponent as InfoIcon } from "@webiny/app-admin/assets/icons/info.svg";
import { PbEditorElement, PbBlockVariable } from "~/types";
import TextInput from "./TextInput";
import { useCurrentBlockElement } from "~/editor/hooks/useCurrentBlockElement";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { ElementLinkStatusWrapper } from "./ElementNotLinked";

const FormWrapper = styled("div")({
    padding: "16px",
    display: "grid",
    rowGap: "16px"
});

const VariableSettings = ({ element }: { element: PbEditorElement }) => {
    const { block } = useCurrentBlockElement();
    const updateElement = useUpdateElement();

    const elementVariables = useMemo(() => {
        const variables = block?.data?.variables?.filter(
            (variable: PbBlockVariable) => variable.id.split(".")[0] === element?.data?.variableId
        );

        return variables ?? [];
    }, [block, element]);

    const onChange = useCallback(
        (label: string, variableId: string) => {
            if (block && block.id) {
                const newVariables = block.data?.variables?.map((variable: PbBlockVariable) => {
                    if (variable?.id === variableId) {
                        return {
                            ...variable,
                            label
                        };
                    } else {
                        return variable;
                    }
                });
                updateElement(
                    {
                        ...block,
                        data: {
                            ...block.data,
                            variables: newVariables
                        }
                    },
                    {
                        history: false
                    }
                );
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
                    const variables = block.data.variables ?? [];
                    const updatedVariables = variables.filter(
                        (variable: PbBlockVariable) =>
                            variable.id.split(".")[0] !== element?.data?.variableId
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
                    updateElement(
                        {
                            ...element,
                            data: updatedElementData
                        },
                        {
                            history: false
                        }
                    );
                }
            }),
        [block, element]
    );

    return (
        <>
            <FormWrapper>
                {elementVariables.map((variable, index) => (
                    <TextInput
                        key={index}
                        label={`${capitalize(variable.type)} ${capitalize(
                            variable.id.split(".")[1]
                        )} Variable Label`}
                        value={variable?.label}
                        onChange={value => onChange(value, variable.id)}
                    />
                ))}
            </FormWrapper>
            <ElementLinkStatusWrapper>
                <strong>Element is linked</strong>
                To prevent users from changing the value of this element, you need to unlink it from
                a variable.
                <ButtonPrimary onClick={onRemove}>Unlink Element</ButtonPrimary>
                <div className="info-wrapper">
                    <InfoIcon /> Click here to learn more about how block variables work
                </div>
            </ElementLinkStatusWrapper>
        </>
    );
};

export default VariableSettings;
