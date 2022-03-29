import React from "react";
import styled from "@emotion/styled";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as EditIcon } from "../../icons/edit.svg";
import { ReactComponent as DeleteIcon } from "../../icons/delete.svg";
import { FormEditorFieldError, useFormEditor } from "../../Context";
import { FbFormModelField } from "~/types";

const FieldContainer = styled("div")({
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
});

const Info = styled("div")({
    display: "flex",
    flexDirection: "column",
    "> *": {
        flex: "1 100%",
        lineHeight: "150%"
    }
});

const Actions = styled("div")({
    display: "flex",
    flexDirection: "row",
    alignItems: "right",
    "> *": {
        flex: "1 100%"
    }
});

const Error = styled("div")({
    color: "red",
    "font-size": "10px",
    display: "block"
});

const createError = (error: FormEditorFieldError): React.ReactNode => {
    console.log(error);
    return (
        <Error>
            {Object.keys(error.errors).map(key => {
                return (
                    <span key={key}>
                        {key}: {error.errors[key]}
                    </span>
                );
            })}
        </Error>
    );
};

interface FieldProps {
    field: FbFormModelField;
    onEdit: (field: FbFormModelField) => void;
    onDelete: (field: FbFormModelField) => void;
    error: FormEditorFieldError | null;
}
const Field: React.FC<FieldProps> = props => {
    const { field, error, onEdit, onDelete } = props;
    const { getFieldPlugin } = useFormEditor();

    const fieldPlugin = getFieldPlugin({ name: field.name });
    return (
        <>
            <FieldContainer>
                <Info>
                    <Typography use={"subtitle1"}>{field.label}</Typography>
                    <Typography use={"caption"}>
                        {fieldPlugin && fieldPlugin.field.label}
                    </Typography>
                </Info>
                <Actions>
                    <IconButton icon={<EditIcon />} onClick={() => onEdit(field)} />
                    <IconButton icon={<DeleteIcon />} onClick={() => onDelete(field)} />
                </Actions>
            </FieldContainer>
            {error && createError(error)}
        </>
    );
};

export default Field;
