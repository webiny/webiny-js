import React, { memo } from "react";
import { Menus } from "./Base/Menus.js";
import { RoutesConfig } from "./Base/RoutesConfig.js";
import { Tenant } from "./Base/Tenant.js";
import { UserMenu } from "./Base/UserMenu.js";
import { LexicalPreset } from "./Base/LexicalPreset.js";
import { DefaultFieldRenderers } from "./Base/DefaultFieldRenderers.js";
import { DefaultLayoutRenderers } from "./Base/DefaultLayoutRenderers.js";
import { DefaultLexicalEditorConfig } from "~/components/LexicalEditor/DefaultLexicalEditorConfig.js";

const BaseExtension = () => {
    return (
        <>
            <Tenant />
            <Menus />
            <UserMenu />
            <RoutesConfig />
            <LexicalPreset />
            <DefaultFieldRenderers />
            <DefaultLayoutRenderers />
            <DefaultLexicalEditorConfig />
        </>
    );
};

export const Base = memo(BaseExtension);
