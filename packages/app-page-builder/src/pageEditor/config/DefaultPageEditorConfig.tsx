import React from "react";
import { EventActionHandlerDecorator, EventActionHandlers } from "./eventActions";
import { AddBlock } from "~/templateEditor/config/Content/BlocksBrowser/AddBlock";
import { AddContent } from "~/templateEditor/config/Content/BlocksBrowser/AddContent";
import { BackButton } from "./TopBar/BackButton/BackButton";
import { BlocksBrowser } from "~/templateEditor/config/Content/BlocksBrowser/BlocksBrowser";
import { EditBlockAction } from "~/templateEditor/config/Sidebar/EditBlockAction";
import { RefreshBlockAction } from "~/templateEditor/config/Sidebar/RefreshBlockAction";
import { UnlinkBlock } from "./Sidebar/UnlinkBlock";
import { Title } from "./TopBar/Title/Title";
import { PublishPageButton } from "./TopBar/PublishPageButton/PublishPageButton";
import { PageSettingsButton } from "./TopBar/PageSettings/PageSettingsButton";
import { PageSettingsOverlay } from "./TopBar/PageSettings/PageSettings";
import { RevisionsDropdownMenu } from "./TopBar/Revisions/Revisions";
import { HideSaveAction } from "~/templateEditor/config/Sidebar/HideSaveAction";
import { VariableSettings } from "./Sidebar/VariableSettings";
import { TemplateMode } from "./Sidebar/TemplateMode";
import { UnlinkTemplate } from "./Toolbar/UnlinkTemplate";
import { PreviewPageOption } from "./TopBar/PreviewPageOption/PreviewPageOption";
import { SetAsHomepageOption } from "./TopBar/SetAsHomepageOption/SetAsHomepageOption";
import { EditorConfig } from "~/editor/config";
import { InjectElementVariables } from "~/render/variables/InjectElementVariables";

const { ElementAction, Ui } = EditorConfig;

export const DefaultPageEditorConfig = React.memo(() => {
    return (
        <>
            <EventActionHandlerDecorator />
            <EditorConfig>
                <EventActionHandlers />
                <Ui.TopBar.Element name={"buttonBack"} group={"left"} element={<BackButton />} />
                <Ui.TopBar.Element name={"title"} group={"left"} element={<Title />} />
                <Ui.TopBar.Action
                    name={"dropdownMenuRevisions"}
                    element={<RevisionsDropdownMenu />}
                    before={"dropdownActions"}
                />
                <Ui.TopBar.Action
                    name={"divider"}
                    element={<Ui.TopBar.Divider />}
                    before={"dropdownActions"}
                />
                <Ui.TopBar.Action
                    name={"buttonPublishPage"}
                    element={<PublishPageButton />}
                    after={"dropdownActions"}
                />
                <Ui.TopBar.Action
                    name={"buttonPageSettings"}
                    element={<PageSettingsButton />}
                    before={"dropdownActions"}
                />
                <Ui.TopBar.DropdownAction name={"previewPage"} element={<PreviewPageOption />} />
                <Ui.TopBar.DropdownAction
                    name={"setAsHomepage"}
                    element={<SetAsHomepageOption />}
                />
                <Ui.Element
                    group={"overlays"}
                    name={"pageSettings"}
                    element={<PageSettingsOverlay />}
                />
                <Ui.Content.Element name={"addBlock"} element={<AddBlock />} />
                <Ui.Content.Element name={"addContent"} element={<AddContent />} />
                <Ui.Element group={"overlays"} name={"blocksBrowser"} element={<BlocksBrowser />} />
                <ElementAction name={"editBlock"} element={<EditBlockAction />} />
                <ElementAction name={"refreshBlock"} element={<RefreshBlockAction />} />
                <Ui.Sidebar.Element
                    name={"variableSettings"}
                    group={"element"}
                    element={<VariableSettings />}
                    after={"elementActions"}
                />
                <UnlinkBlock />
                <HideSaveAction />
                <TemplateMode />
                <UnlinkTemplate />
                <InjectElementVariables />
            </EditorConfig>
        </>
    );
});

DefaultPageEditorConfig.displayName = "DefaultPageEditorConfig";
