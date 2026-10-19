import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { EnabledExtensionsFeature } from "./feature.js";
import { ExtensionMenus } from "./ExtensionMenus.js";
import { ExtensionFieldRenderers } from "./ExtensionFieldRenderers.js";

/** Loads every enabled admin extension once someone signs in, and renders each kind. */
export const EnabledExtensions = () => {
    const { presenter } = useFeature(EnabledExtensionsFeature);

    useEffect(() => {
        presenter.start();
        return () => presenter.stop();
    }, [presenter]);

    return (
        <>
            <ExtensionMenus />
            <ExtensionFieldRenderers />
        </>
    );
};
