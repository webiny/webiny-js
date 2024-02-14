import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { Form } from "@webiny/form";
import { Validator } from "@webiny/validation/types";
import { makeDecoratable } from "@webiny/react-composition";
import InputField from "~/editor/plugins/elementSettings/components/InputField";
import { Typography } from "@webiny/ui/Typography";
import { SimpleButton } from "~/editor/plugins/elementSettings/components/StyledComponents";
import { useVariable } from "~/hooks/useVariable";

const ButtonContainer = styled.div`
    margin-top: 16px;
`;

const validateUrl: Validator = (value: string | undefined) => {
    if (!value) {
        return true;
    }

    if (Boolean(new URL(value))) {
        return true;
    }

    throw Error("Value must be a valid URL.");
};
interface LinkVariableInputProps {
    variableId: string;
    placeholder?: string;
    description?: string;
}

const LinkVariableInput = makeDecoratable(
    "LinkVariableInput",
    ({ variableId, placeholder, description }: LinkVariableInputProps) => {
        const { value, onChange } = useVariable(variableId);
        const [localValue, setLocalValue] = useState(value);

        useEffect(() => {
            if (localValue !== value) {
                setLocalValue(value);
            }
        }, [value]);

        return (
            <Form data={{ url: value }} onSubmit={({ url }) => onChange(url, true)}>
                {({ Bind, submit }) => (
                    <>
                        <Bind name={"url"} validators={validateUrl}>
                            {({ value, onChange: formOnChange, validation }) => (
                                <InputField
                                    value={value}
                                    onChange={formOnChange}
                                    placeholder={placeholder}
                                    description={description}
                                    validation={validation}
                                />
                            )}
                        </Bind>
                        <ButtonContainer>
                            <SimpleButton onClick={submit}>
                                <Typography use={"caption"}>Save</Typography>
                            </SimpleButton>
                        </ButtonContainer>
                    </>
                )}
            </Form>
        );
    }
);

export default LinkVariableInput;
