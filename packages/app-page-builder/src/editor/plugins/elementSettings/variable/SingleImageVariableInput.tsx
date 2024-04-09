import React from "react";
import { useVariable } from "~/hooks/useVariable";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";

interface SingleImageVariableInputProps {
    variableId: string;
}

const SingleImageVariableInput = ({ variableId }: SingleImageVariableInputProps) => {
    const { value, onChange } = useVariable(variableId);

    return <SingleImageUpload onChange={value => onChange(value, true)} value={value} />;
};

export default SingleImageVariableInput;
