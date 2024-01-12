import React from "react";
import styled from "@emotion/styled";
import { useVariable } from "~/hooks/useVariable";
import { IconPicker } from "@webiny/app-admin/components/IconPicker";
import { ICON_PICKER_SIZE } from "@webiny/app-admin/components/IconPicker/types";

const Wrapper = styled.div`
    & > div {
        justify-content: start;
    }
`;

interface IconVariableInputProps {
    variableId: string;
}

const IconVariableInput = ({ variableId }: IconVariableInputProps) => {
    const { value, onChange } = useVariable(variableId);

    return (
        <Wrapper>
            <IconPicker
                size={ICON_PICKER_SIZE.SMALL}
                value={value.id}
                onChange={value => {
                    onChange(value, true);
                }}
            />
        </Wrapper>
    );
};

export default IconVariableInput;
