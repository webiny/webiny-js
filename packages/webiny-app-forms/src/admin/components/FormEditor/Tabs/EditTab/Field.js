import React from "react";
import styled from "react-emotion";
import { IconButton } from "webiny-ui/Button";
import { ReactComponent as EditIcon } from "../../icons/edit.svg";
import { ReactComponent as DeleteIcon } from "../../icons/delete.svg";

const FieldContainer = styled("div")({
    display: "flex",
    flexDirection: "row"
});

const Info = styled("div")({
    display: "flex",
    flexDirection: "column",
    "> *": {
        flex: "1 100%"
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

const Field = props => {
    const { field, onEdit, onDelete } = props;
    return (
        <FieldContainer>
            <Info>
                <strong>{field.label}</strong>
                <span>
                    {field.fieldId} ({field.type})
                </span>
            </Info>
            <Actions>
                <IconButton icon={<EditIcon />} onClick={() => onEdit(field)} />
                <IconButton icon={<DeleteIcon />} onClick={() => onDelete(field)} />
            </Actions>
        </FieldContainer>
    );
};

export default Field;
