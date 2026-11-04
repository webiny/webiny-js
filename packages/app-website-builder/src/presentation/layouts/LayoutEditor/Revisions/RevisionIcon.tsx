import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as LockIcon } from "@webiny/icons/lock.svg";
import { ReactComponent as BeenHereIcon } from "@webiny/icons/beenhere.svg";
import { ReactComponent as GestureIcon } from "@webiny/icons/gesture.svg";
import type { Layout } from "~/features/layouts/index.js";

interface RevisionIconProps {
    revision: Layout;
}

export const RevisionIcon = ({ revision }: RevisionIconProps) => {
    if (revision.status === "published") {
        return <Icon label={"Published revision"} icon={<BeenHereIcon />} color={"accent"} />;
    }
    if (revision.locked) {
        return <Icon label={"Locked revision"} icon={<LockIcon />} />;
    }
    return <Icon label={"Draft revision"} icon={<GestureIcon />} />;
};
