import React from "react";
import { ReactComponent as SavedIcon } from "@material-design-icons/svg/outlined/favorite_border.svg";
import { ReactComponent as ContentIcon } from "@material-design-icons/svg/outlined/insights.svg";
import { PbEditorPageElementGroupPlugin } from "~/types";
import EmptyElementGroupView from "../../../components/EmptyElementGroupView";

export default {
    name: "pb-editor-element-group-saved",
    type: "pb-editor-page-element-group",
    group: {
        title: "Saved",
        icon: <SavedIcon />,
        emptyView: (
            <EmptyElementGroupView
                icon={<ContentIcon />}
                title={"Bring your elements to life."}
                body={`Let's start by saving some great elements. Simply select an element and click
            Save icon in Element tab.`}
            />
        )
    }
} as PbEditorPageElementGroupPlugin;
