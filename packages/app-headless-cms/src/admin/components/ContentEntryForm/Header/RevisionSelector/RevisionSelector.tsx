import React from "react";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import { MenuItem } from "@webiny/ui/Menu";
import { ReactComponent as DownButton } from "@material-design-icons/svg/round/arrow_drop_down.svg";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import { statuses as statusLabels } from "~/admin/constants";
import { CmsContentEntryRevision } from "~/types";

import { Button, Menu } from "./RevisionSelector.styles";

interface CmsEntryRevision extends Pick<CmsContentEntryRevision, "id"> {
    meta: Pick<CmsContentEntryRevision["meta"], "version" | "status">;
}

const defaultRevisions: CmsEntryRevision[] = [
    {
        id: "new",
        meta: {
            version: 1,
            status: "draft"
        }
    }
];

export const RevisionSelector = () => {
    const { entry, revisions, loading } = useContentEntry();
    const { location, history } = useRouter();
    const query = new URLSearchParams(location.search);

    const currentRevision = {
        version: get(entry, "meta.version", 1) as number,
        status: get(entry, "meta.status", "draft") as CmsContentEntryRevision["meta"]["status"]
    };

    const allRevisions = revisions.length ? revisions : defaultRevisions;

    return (
        <Menu
            handle={
                <Button disabled={loading}>
                    v{currentRevision.version} ({statusLabels[currentRevision.status]}){" "}
                    <Icon icon={<DownButton />} />
                </Button>
            }
        >
            {allRevisions.map(revision => (
                <MenuItem
                    key={revision.id}
                    onClick={() => {
                        query.set("id", encodeURIComponent(revision.id));
                        history.push({ search: query.toString() });
                    }}
                >
                    <Typography use={"body2"}>v{revision.meta.version}</Typography>
                    <Typography use={"caption"}>({statusLabels[revision.meta.status]})</Typography>
                </MenuItem>
            ))}
        </Menu>
    );
};
