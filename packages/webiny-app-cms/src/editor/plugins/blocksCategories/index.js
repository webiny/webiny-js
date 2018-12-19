// @flow
import React from "react";
import type { CmsBlockCategoryPluginType } from "webiny-app-cms/types";
import { ReactComponent as AllIcon } from "./icons/round-clear_all-24px.svg";
import { ReactComponent as HeartIcon } from "./icons/round-favorite-24px.svg";
import { ReactComponent as GeneralIcon } from "./icons/round-gesture-24px.svg";

export default ([
    {
        type: "cms-block-category",
        name: "cms-block-category-all",
        title: "All blocks",
        description: "List of all available blocks.",
        icon: <AllIcon />
    },
    {
        type: "cms-block-category",
        name: "cms-block-category-general",
        title: "General",
        description: "List of general purpose blocks.",
        icon: <GeneralIcon />
    },
    {
        type: "cms-block-category",
        name: "cms-block-category-saved",
        title: "Saved",
        description: "List of saved blocks.",
        icon: <HeartIcon />
    }
]: Array<CmsBlockCategoryPluginType>);
