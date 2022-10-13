import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { Input } from "@webiny/ui/Input";
import { PbBlockVariable } from "~/types";

const VariableSettingsWrapper = styled("div")({
    padding: "16px",
    display: "grid",
    rowGap: "16px"
});

const VariableSettings: React.FC = () => {
    const [element] = useActiveElement();
    const updateElement = useUpdateElement();

    const onChange = useCallback(
        (value: string, variableId: string) => {
            if (element) {
                const newVariables = element?.data?.variables?.map((variable: PbBlockVariable) => {
                    if (variable?.id === variableId) {
                        return {
                            ...variable,
                            value
                        };
                    } else {
                        return variable;
                    }
                });
                updateElement(
                    {
                        ...element,
                        data: {
                            ...element.data,
                            variables: newVariables
                        }
                    },
                    {
                        history: false
                    }
                );
            }
        },
        [element, updateElement]
    );

    const onBlur = useCallback(() => {
        if (element) {
            updateElement(element);
        }
    }, [element, updateElement]);

    return (
        <VariableSettingsWrapper>
            {element?.data?.variables?.map((variable: PbBlockVariable, index: number) => (
                <Input
                    key={index}
                    label={variable?.label}
                    value={variable?.value}
                    onChange={value => onChange(value, variable.id)}
                    onBlur={onBlur}
                />
            ))}
        </VariableSettingsWrapper>
    );
};

export default VariableSettings;
