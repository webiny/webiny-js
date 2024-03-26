import React from "react";
import { EventActionHandlerPlugin, EventActionPlugins } from "./eventActions";
import { PageEditorConfig } from "~/pageEditor/editorConfig/PageEditorConfig";
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
import { PageOptionsDropdown } from "./TopBar/PageOptionsDropdown/PageOptionsDropdown";
import { HideSaveAction } from "~/templateEditor/config/Sidebar/HideSaveAction";
import { VariableSettings } from "./Sidebar/VariableSettings";
import { TemplateMode } from "./Sidebar/TemplateMode";
import { UnlinkTemplate } from "./Toolbar/UnlinkTemplate";
import { PreviewPageOption } from "./TopBar/PreviewPageOption/PreviewPageOption";
import { SetAsHomepageOption } from "./TopBar/SetAsHomepageOption/SetAsHomepageOption";

const { TopBar, Content, Sidebar, Element } = PageEditorConfig;

export const DefaultPageEditorConfig = React.memo(() => {
    return (
        <>
            <EventActionHandlerPlugin />
            <EventActionPlugins />
            <PageEditorConfig>
                <TopBar.Element name={"buttonBack"} group={"left"} element={<BackButton />} />
                <TopBar.Element name={"title"} group={"left"} element={<Title />} />
                <TopBar.Action name={"dropdownMenuRevisions"} element={<RevisionsDropdownMenu />} />
                <TopBar.Action name={"divider"} element={<TopBar.Divider />} />
                <TopBar.Action name={"buttonPageSettings"} element={<PageSettingsButton />} />
                <TopBar.Action name={"dropdownActions"} element={<PageOptionsDropdown />} />
                <TopBar.Action name={"buttonPublishPage"} element={<PublishPageButton />} />
                <TopBar.DropdownAction name={"previewPage"} element={<PreviewPageOption />} />
                <TopBar.DropdownAction name={"setAsHomepage"} element={<SetAsHomepageOption />} />
                <Element
                    group={"overlays"}
                    name={"pageSettings"}
                    element={<PageSettingsOverlay />}
                />
                <Content.Element name={"addBlock"} element={<AddBlock />} />
                <Content.Element name={"addContent"} element={<AddContent />} />
                <Element group={"overlays"} name={"blocksBrowser"} element={<BlocksBrowser />} />
                <Sidebar.ElementAction name={"editBlock"} element={<EditBlockAction />} />
                <Sidebar.ElementAction name={"refreshBlock"} element={<RefreshBlockAction />} />

                <Sidebar.Element
                    name={"variableSettings"}
                    group={"element"}
                    element={<VariableSettings />}
                    after={"elementActions"}
                />
                <UnlinkBlock />
                <HideSaveAction />
                <TemplateMode />
                <UnlinkTemplate />
            </PageEditorConfig>
        </>
    );
});

DefaultPageEditorConfig.displayName = "DefaultPageEditorConfig";
