import React, { useRef, useState, useEffect } from "react";
import styled from "@emotion/styled";
import { useVariable } from "~/hooks/useVariable";
import { IconPicker } from "@webiny/app-admin/components/IconPicker";
import { ICON_PICKER_SIZE, Icon } from "@webiny/app-admin/components/IconPicker/types";

const Wrapper = styled.div`
    & > div {
        justify-content: start;
    }
`;

interface IconVariableInputProps {
    variableId: string;
}

const IconVariableInput = ({ variableId }: IconVariableInputProps) => {
    const { value = {}, onChange } = useVariable(variableId);

    const iconRef = useRef<HTMLDivElement>(null);
    const [iconValue, setIconValue] = useState<Icon>(value);

    useEffect(() => {
        setIconValue(value);
    }, [value.markup]);

    useEffect(() => {
        if (!iconRef.current) {
            return;
        }

        const markup = iconRef.current.innerHTML;

        if (value.markup !== markup) {
            onChange({ ...iconValue, markup, markupWidth: value?.markupWidth }, true);
        }
    }, [iconValue]);

    return (
        <Wrapper>
            <IconPicker size={ICON_PICKER_SIZE.SMALL} value={iconValue} onChange={setIconValue} />
            {/* Renders IconPicker.Icon for accessing its HTML without displaying it. */}
            <div style={{ display: "none" }} ref={iconRef}>
                <IconPicker.Icon icon={iconValue} size={value?.markupWidth} />
            </div>
        </Wrapper>
    );
};

export default IconVariableInput;
