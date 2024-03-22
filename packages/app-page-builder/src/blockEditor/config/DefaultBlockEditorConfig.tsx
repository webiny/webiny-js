import React from "react";
import { BackButton } from "~/blockEditor/config/editorBar/BackButton";
import { Title } from "~/blockEditor/config/editorBar/Title";
import { SaveBlockButton } from "~/blockEditor/config/editorBar/SaveBlockButton";
import { BlockSettingsButton } from "~/blockEditor/config/editorBar/BlockSettings/BlockSettingsButton";
import { BlockEditorConfig } from "../editorConfig/BlockEditorConfig";

const AddElement = () => {
    const { elements } = BlockEditorConfig.useEditorConfig();

    console.log("elements", elements);

    return null;
};

const { TopBar } = BlockEditorConfig;

export const DefaultBlockEditorConfig = () => {
    return (
        <BlockEditorConfig>
            <TopBar.Element name={"buttonBack"} group={"left"} element={<BackButton />} />
            <TopBar.Element name={"title"} group={"left"} element={<Title />} />
            <TopBar.Element name={"responsiveModeSelector"} group={"left"} element={<Title />} />
            <TopBar.Action name={"buttonSaveBlock"} element={<SaveBlockButton />} />
            <TopBar.Action
                name={"buttonBlockSettings"}
                element={<BlockSettingsButton />}
                before={"buttonSaveBlock"}
            />
            {/* Mount invisible component to access config context. */}
            <AddElement />
        </BlockEditorConfig>
    );
};
