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
        (value: string, varRef: string) => {
            if (element) {
                const newVariables = element?.data?.variables?.map((variable: PbBlockVariable) => {
                    if (variable?.varRef === varRef) {
                        return {
                            ...variable,
                            value
                        };
                    } else {
                        return variable;
                    }
                });
                updateElement({
                    ...element,
                    data: {
                        ...element.data,
                        variables: newVariables
                    }
                });
            }
        },
        [element, updateElement]
    );

    return (
        <VariableSettingsWrapper>
            {element?.data?.variables?.map((variable: PbBlockVariable, index: number) => (
                <Input
                    key={index}
                    label={variable?.label}
                    value={variable?.value}
                    onChange={value => onChange(value, variable.varRef)}
                />
            ))}
        </VariableSettingsWrapper>
    );
};

export default VariableSettings;
