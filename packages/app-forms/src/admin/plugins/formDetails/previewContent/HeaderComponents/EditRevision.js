// @flow
import React from "react";
import useReactRouter from "use-react-router";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as EditIcon } from "@webiny/app-forms/admin/icons/edit.svg";
import { useRevision } from "../../formRevisions/useRevision";

const EditRevision = ({ revision }) => {
    const { createRevision } = useRevision({ revision });
    const { history } = useReactRouter();

    if (revision.status === "draft") {
        return (
            <Tooltip content={"Edit"} placement={"top"}>
                <IconButton
                    icon={<EditIcon />}
                    onClick={() => history.push(`/forms/${revision.id}`)}
                />
            </Tooltip>
        );
    }

    return (
        <Tooltip content={"New draft based on this version..."} placement={"top"}>
            <IconButton icon={<EditIcon />} onClick={createRevision} />
        </Tooltip>
    );
};

export default EditRevision;
