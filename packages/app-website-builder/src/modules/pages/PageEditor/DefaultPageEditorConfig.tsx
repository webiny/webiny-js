import React from "react";
import { PageAutoSave } from "./PageAutoSave.js";
import { BackButton } from "./TopBar/BackButton.js";
import { Title } from "./TopBar/Title.js";
import { PublishButton } from "./TopBar/PublishButton.js";
import { RevisionsMenu } from "./TopBar/RevisionsMenu.js";
import { SettingsButton } from "./TopBar/SettingsButton.js";
import { HasPermission } from "~/presentation/security/HasPermission.js";
import { InternalPageEditorConfig } from "./PageEditorConfig.js";
import { PageSettingsConfig } from "~/modules/pages/PageEditor/PageSettings/PageSettingsConfig.js";
import { TopBarOptionsMenu } from "~/BaseEditor/config/TopBar/Layout.js";

const { Ui } = InternalPageEditorConfig;

export const DefaultPageEditorConfig = () => {
    return (
        <InternalPageEditorConfig>
            <Ui.TopBar.Element name={"buttonBack"} group={"left"} element={<BackButton />} />
            <Ui.TopBar.Element name={"title"} group={"left"} element={<Title />} />
            <Ui.TopBar.Action name={"revisionsMenu"} element={<RevisionsMenu />} />
            <Ui.TopBar.Action
                name={"buttonSettings"}
                element={
                    <Ui.IsNotReadOnly>
                        <SettingsButton />
                    </Ui.IsNotReadOnly>
                }
            />
            <Ui.TopBar.Action name={"optionsMenu"} element={<TopBarOptionsMenu />} />
            <HasPermission entity={"page"} action={"publish"}>
                <Ui.TopBar.Action name={"buttonPublish"} element={<PublishButton />} />
            </HasPermission>
            <HasPermission entity={"page"} action={"edit"}>
                <Ui.TopBar.Element group={"left"} name={"autoSave"} element={<PageAutoSave />} />
            </HasPermission>
            <PageSettingsConfig />
        </InternalPageEditorConfig>
    );
};
