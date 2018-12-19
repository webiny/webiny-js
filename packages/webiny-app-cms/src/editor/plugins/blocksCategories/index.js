// @flow
import React from "react";
import type { CmsBlockCategoryPluginType } from "webiny-app-cms/types";
import { ReactComponent as GeneralIcon } from "./icons/round-gesture-24px.svg";

export default ([
    {
        type: "cms-block-category",
        name: "cms-block-category-general",
        title: "General",
        description: "List of general purpose blocks.",
        icon: <GeneralIcon />
    }
]: Array<CmsBlockCategoryPluginType>);
