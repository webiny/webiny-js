import React from "react";
import { useRouter } from "@webiny/react-router";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as EditIcon } from "../../../../icons/edit.svg";
import { useRevision } from "../../formRevisions/useRevision";
import { usePermission } from "~/hooks/usePermission";
import { FbRevisionModel } from "~/types";

interface EditRevisionProps {
    revision: FbRevisionModel;
    form: FbRevisionModel;
}
const EditRevision = ({ revision, form }: EditRevisionProps) => {
    const { createRevision } = useRevision({ revision, form });
    const { history } = useRouter();
    const { canUpdate } = usePermission();

    // Render nothing is user doesn't have required permission.
    if (!canUpdate(form)) {
        return null;
    }

    if (revision.status === "draft") {
        return (
            <Tooltip content={"Edit"} placement={"top"}>
                <IconButton
                    data-testid={"fb.form-preview.header.edit-revision"}
                    icon={<EditIcon />}
                    onClick={() =>
                        history.push(`/form-builder/forms/${encodeURIComponent(revision.id)}`)
                    }
                />
            </Tooltip>
        );
    }

    return (
        <Tooltip content={"New draft based on this version..."} placement={"top"}>
            <IconButton
                data-testid={"fb.form-preview.header.create-revision"}
                icon={<EditIcon />}
                onClick={() => createRevision(revision.id)}
            />
        </Tooltip>
    );
};

export default EditRevision;
