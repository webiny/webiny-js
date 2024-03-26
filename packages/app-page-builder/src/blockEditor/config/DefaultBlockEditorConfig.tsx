import React from "react";
import { BlockEditorConfig } from "~/blockEditor/editorConfig/BlockEditorConfig";
import { BackButton } from "~/blockEditor/config/TopBar/BackButton";
import { Title } from "~/blockEditor/config/TopBar/Title";
import { SaveBlockButton } from "~/blockEditor/config/TopBar/SaveBlockButton";
import { BlockSettingsButton } from "~/blockEditor/config/TopBar/BlockSettings/BlockSettingsButton";
import { ElementSettingsDecorator } from "~/blockEditor/config/ElementSettingsTab";

const { TopBar, Toolbar } = BlockEditorConfig;

export const DefaultBlockEditorConfig = () => {
    return (
        <BlockEditorConfig>
            <TopBar.Element name={"buttonBack"} group={"left"} element={<BackButton />} />
            <TopBar.Element name={"title"} group={"left"} element={<Title />} />
            <TopBar.Action name={"buttonSaveBlock"} element={<SaveBlockButton />} />
            <TopBar.Action
                name={"buttonBlockSettings"}
                element={<BlockSettingsButton />}
                before={"buttonSaveBlock"}
            />
            <Toolbar.Element name={"savingIndicator"} remove />
            <ElementSettingsDecorator />
        </BlockEditorConfig>
    );
};
