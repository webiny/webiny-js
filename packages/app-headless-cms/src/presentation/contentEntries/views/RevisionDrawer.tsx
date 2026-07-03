import React from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { useHotkeys } from "@webiny/app-admin";
import { Drawer } from "@webiny/admin-ui";
import { RevisionsListFeature } from "../revisionsList/feature.js";
import { RevisionsList } from "./RevisionsList.js";

export const RevisionDrawer = observer(() => {
    const { presenter: revisionsPresenter } = useFeature(RevisionsListFeature);
    const { vm } = revisionsPresenter;

    useHotkeys({
        zIndex: 55,
        disabled: !vm.visible,
        keys: {
            esc: () => revisionsPresenter.hide()
        }
    });

    return (
        <Drawer
            title={"Entry revisions"}
            open={vm.visible}
            onOpenChange={open => {
                if (!open) {
                    revisionsPresenter.hide();
                }
            }}
            modal
            bodyPadding={false}
            headerSeparator={true}
            width={1000}
        >
            <RevisionsList />
        </Drawer>
    );
});
