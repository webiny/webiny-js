import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { ContentGroupsMenuPresenterFeature } from "~/presentation/contentGroupsMenu/feature.js";
import { GroupMenu } from "./GroupMenu.js";
import { HasContentEntryPermissions } from "./HasContentEntryPermissions.js";
import { GroupContentModels } from "./GroupContentModels.js";

export const ContentGroupsMenuItems = observer(() => {
    const { presenter } = useFeature(ContentGroupsMenuPresenterFeature);

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    const { groups, loading } = presenter.vm;

    if (loading || groups.length === 0) {
        return null;
    }

    return (
        <>
            {groups.map(group => (
                <HasContentEntryPermissions key={group.id} group={group}>
                    <>
                        <GroupMenu group={group} />
                        <GroupContentModels group={group} />
                    </>
                </HasContentEntryPermissions>
            ))}
        </>
    );
});
