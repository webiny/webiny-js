// @flow
import * as React from "react";
import { Icon } from "webiny-ui/Icon";
import { ReactComponent as LinkIcon } from "./icons/round-link-24px.svg";
import { ReactComponent as FolderIcon } from "./icons/round-folder-24px.svg";
import { ReactComponent as PageIcon } from "./icons/round-subject-24px.svg";
import { ReactComponent as PagesIcon } from "./icons/round-format_list_bulleted-24px.svg";

export default {
    link: {
        data: () => ({ type: "link" }),
        canNodeHaveChildren: false,
        icon: <Icon icon={<LinkIcon />} />
    },
    folder: {
        data: () => ({ type: "folder" }),
        canNodeHaveChildren: true,
        icon: <Icon icon={<FolderIcon />} />
    },
    page: {
        data: () => ({ type: "page" }),
        canNodeHaveChildren: false,
        icon: <Icon icon={<PageIcon />} />
    },
    pageList: {
        data: () => ({ type: "pageList" }),
        canNodeHaveChildren: false,
        icon: <Icon icon={<PagesIcon />} />
    }
};
