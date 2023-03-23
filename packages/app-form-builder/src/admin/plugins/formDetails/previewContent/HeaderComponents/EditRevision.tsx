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
const EditRevision: React.VFC<EditRevisionProps> = ({ revision, form }) => {
    const { createRevision } = useRevision({ revision, form });
    const { history } = useRouter();
    const { canEdit } = usePermission();

    // Render nothing is user doesn't have required permission.
    if (!canEdit(form)) {
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
