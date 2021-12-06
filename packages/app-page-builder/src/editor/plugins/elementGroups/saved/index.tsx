import React from "react";
import { ReactComponent as SavedIcon } from "../../../assets/icons/round-favorite-24px.svg";
import { PbEditorPageElementGroupPlugin } from "../../../../types";
import EmptyElementGroupView from "../../../components/EmptyElementGroupView";
import { ReactComponent as ContentIcon } from "../../../assets/icons/insights.svg";

export default new PbEditorPageElementGroupPlugin({
    name: "pb-editor-element-group-saved",
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
});
