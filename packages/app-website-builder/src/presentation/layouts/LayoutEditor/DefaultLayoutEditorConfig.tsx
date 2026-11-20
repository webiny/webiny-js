import React from "react";
import { TopBarOptionsMenu } from "~/BaseEditor/config/TopBar/Layout.js";
import { HasPermission } from "~/presentation/security/HasPermission.js";
import { InternalLayoutEditorConfig } from "./LayoutEditorConfig.js";
import { BackButton } from "./TopBar/BackButton.js";
import { Title } from "./TopBar/Title.js";
import { RevisionsMenu } from "./TopBar/RevisionsMenu.js";
import { NewRevisionButton } from "./TopBar/NewRevisionButton.js";
import { PublishButton } from "./TopBar/PublishButton.js";
import { UnpublishButton } from "./TopBar/UnpublishButton.js";
import { SettingsButton } from "./TopBar/SettingsButton.js";
import { PreviewPagePicker } from "./PreviewPage/PreviewPagePicker.js";
import { LayoutAutoSave } from "./LayoutAutoSave.js";
import { LayoutGlobalComponents } from "./GlobalComponents/LayoutGlobalComponents.js";
import { LayoutContentAreas } from "./LayoutContentAreas.js";
import { LayoutGlobalComponentSaveBar } from "./GlobalComponents/LayoutGlobalComponentSaveBar.js";

const { Ui } = InternalLayoutEditorConfig;

/**
 * The page editor, for layouts: a layout is versioned like a page, with revisions and publishing, but has
 * no page settings. It can be previewed with a page. Global components are placed and edited here; their
 * values are saved on their own, not with the layout.
 */
export const DefaultLayoutEditorConfig = () => {
    return (
        <InternalLayoutEditorConfig>
            <Ui.TopBar.Element name={"buttonBack"} group={"left"} element={<BackButton />} />
            <Ui.TopBar.Element name={"title"} group={"left"} element={<Title />} />
            <Ui.TopBar.Action name={"previewPage"} element={<PreviewPagePicker />} />
            <Ui.TopBar.Action name={"revisionsMenu"} element={<RevisionsMenu />} />
            <Ui.TopBar.Action name={"optionsMenu"} element={<TopBarOptionsMenu />} />
            <Ui.TopBar.Element
                name={"globalComponents"}
                group={"left"}
                element={<LayoutGlobalComponents />}
            />
            <Ui.TopBar.Element
                name={"contentAreas"}
                group={"left"}
                element={<LayoutContentAreas />}
            />
            <HasPermission entity={"page"} action={"create"}>
                <Ui.IsReadOnly>
                    <Ui.TopBar.Action name={"buttonNewRevision"} element={<NewRevisionButton />} />
                </Ui.IsReadOnly>
            </HasPermission>
            <HasPermission entity={"page"} action={"unpublish"}>
                <Ui.IsReadOnly>
                    <Ui.TopBar.Action name={"buttonUnpublish"} element={<UnpublishButton />} />
                </Ui.IsReadOnly>
            </HasPermission>
            <HasPermission entity={"page"} action={"publish"}>
                <Ui.IsNotReadOnly>
                    <Ui.TopBar.Action name={"buttonPublish"} element={<PublishButton />} />
                </Ui.IsNotReadOnly>
            </HasPermission>
            <HasPermission entity={"page"} action={"edit"}>
                {/* A published revision is locked: its title and slug change in a new revision. */}
                <Ui.IsNotReadOnly>
                    <Ui.TopBar.Action
                        name={"buttonSettings"}
                        before={"revisionsMenu"}
                        element={<SettingsButton />}
                    />
                </Ui.IsNotReadOnly>
                <Ui.TopBar.Element group={"left"} name={"autoSave"} element={<LayoutAutoSave />} />
                {/* Globals are not autosaved with the layout: their settings get their own save. */}
                <Ui.Sidebar.Element
                    name={"globalComponentSave"}
                    group={"element"}
                    before={"elementSettings"}
                    element={
                        <Ui.OnActiveElement>
                            <LayoutGlobalComponentSaveBar />
                        </Ui.OnActiveElement>
                    }
                />
            </HasPermission>
        </InternalLayoutEditorConfig>
    );
};
