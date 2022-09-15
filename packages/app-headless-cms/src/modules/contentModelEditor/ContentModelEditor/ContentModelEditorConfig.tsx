import React, { useEffect } from "react";
import { plugins } from "@webiny/plugins";
import { BackButton } from "./ContentModelEditorConfig/BackButton";
import { ModelName } from "./ContentModelEditorConfig/ModelName";
import { CreateContentButton } from "./ContentModelEditorConfig/CreateContentButton";
import { SaveContentModelButton } from "./ContentModelEditorConfig/SaveContentModelButton";
import { ModelSettingsButton } from "./ContentModelEditorConfig/ModelSettings/ModelSettingsButton";
import { generalSettingsPlugin } from "./ContentModelEditorConfig/ModelSettings/generalSettingsPlugin";
import { makeComposable } from "@webiny/react-composition";

export const ContentModelEditorConfig = makeComposable("ContentModelEditorConfig", () => {
    useEffect(() => {
        plugins.register(generalSettingsPlugin);
        return () => {
            plugins.unregister(generalSettingsPlugin.name as string);
        };
    }, []);

    return (
        <>
            <BackButton />
            <ModelName />
            <CreateContentButton />
            <ModelSettingsButton />
            <SaveContentModelButton />
        </>
    );
});

ContentModelEditorConfig.displayName = "ContentModelEditorConfig";
