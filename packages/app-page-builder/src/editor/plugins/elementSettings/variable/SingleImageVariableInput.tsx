import React from "react";
import { useVariable } from "~/hooks/useVariable";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";

type ImageData = {
    id: string;
    key: string;
    name: string;
    size: number;
    src: string;
    type: string;
};

interface SingleImageVariableInputProps {
    variableId: string;
}

const SingleImageVariableInput: React.FC<SingleImageVariableInputProps> = ({ variableId }) => {
    const { value, onChange } = useVariable(variableId);

    return (
        <SingleImageUpload onChange={(value: ImageData) => onChange(value, true)} value={value} />
    );
};

export default SingleImageVariableInput;
