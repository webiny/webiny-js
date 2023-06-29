import React from "react";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
// import { useRouter } from "@webiny/react-router";
import { usePermission } from "~/admin/hooks/usePermission";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/filled/delete.svg";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import { useDeleteEntry } from "./useDeleteEntry";

export const DeleteItem: React.FC = () => {
    const { entry, loading } = useContentEntry();
    const { canDelete } = usePermission();
    const { confirmDelete } = useDeleteEntry();
    // const { history } = useRouter();
    // history.push(`/cms/content-entries/${contentModel.modelId}`);

    if (!canDelete(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <MenuItem
            onClick={confirmDelete}
            disabled={!entry.id || loading}
            data-testid={"cms.content-form.header.delete"}
        >
            <ListItemGraphic>
                <Icon icon={<DeleteIcon />} />
            </ListItemGraphic>
            Delete
        </MenuItem>
    );
};
