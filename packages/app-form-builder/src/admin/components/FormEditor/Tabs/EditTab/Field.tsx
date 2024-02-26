import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { Switch } from "@webiny/ui/Switch";
import { ReactComponent as EditIcon } from "../../icons/edit.svg";
import { ReactComponent as DeleteIcon } from "../../icons/delete.svg";
import { useFormEditor } from "../../Context";
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
    },
    ".switch-wrapper": {
        display: "flex",
        alignItems: "center",
        color: "var(--mdc-theme-text-secondary-on-background)",
        ".webiny-ui-switch": {
            margin: "0 16px"
        }
    }
});

const StyledDivider = styled("div")({
    width: 2,
    margin: 5,
    backgroundColor: "var(--mdc-theme-on-background)"
});

interface FieldProps {
    field: FbFormModelField;
    onEdit: (field: FbFormModelField) => void;
    onDelete: (field: FbFormModelField) => void;
}
const Field = (props: FieldProps) => {
    const { field, onEdit, onDelete } = props;
    const { getFieldPlugin, updateField } = useFormEditor();
    const fieldPlugin = getFieldPlugin({ name: field.name });

    const isRequired = field.validation?.some(validation => validation.name === "required");

    const toggleRequiredValidator = useCallback(() => {
        if (isRequired) {
            updateField({
                ...field,
                validation: field.validation?.filter(validation => validation.name !== "required")
            });
        } else {
            updateField({
                ...field,
                validation: [
                    ...(field.validation || []),
                    {
                        message: "Value is required.",
                        name: "required",
                        settings: {}
                    }
                ]
            });
        }
    }, [isRequired, field]);

    return (
        <FieldContainer>
            <Info>
                <Typography use={"subtitle1"}>{field.label}</Typography>
                <Typography use={"caption"}>{fieldPlugin && fieldPlugin.field.label}</Typography>
            </Info>
            <Actions>
                <div className="switch-wrapper">
                    <Typography use={"body2"}>Required</Typography>
                    <Switch value={isRequired} onChange={toggleRequiredValidator} />
                </div>
                <StyledDivider />
                <IconButton icon={<EditIcon />} onClick={() => onEdit(field)} />
                <IconButton icon={<DeleteIcon />} onClick={() => onDelete(field)} />
            </Actions>
        </FieldContainer>
    );
};

export default Field;
