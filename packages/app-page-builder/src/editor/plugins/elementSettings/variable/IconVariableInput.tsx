import React from "react";
import styled from "@emotion/styled";
import { useVariable } from "~/hooks/useVariable";
import IconPicker from "~/editor/components/IconPicker";
import { getSvg } from "~/editor/plugins/elements/utils/iconUtils";

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
                value={value.id}
                onChange={value => {
                    onChange({ id: value.id, svg: getSvg(value.id) }, true);
                }}
                useInSidebar
            />
        </Wrapper>
    );
};

export default IconVariableInput;
