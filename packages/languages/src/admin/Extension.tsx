import React from "react";
import { AdminConfig, HasPermission } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import { Routes } from "@webiny/app-headless-cms";
import { LANGUAGE_MODEL_ID } from "~/shared/constants.js";
import { SecurityPermission } from "./SecurityPermission.js";
import { LanguageEntryList } from "~/admin/LanguageEntryList.js";

const { Menu } = AdminConfig;

export const Extension = () => {
    const { getLink } = useRouter();

    const link = getLink(Routes.ContentEntries.List, { modelId: LANGUAGE_MODEL_ID });

    return (
        <>
            <SecurityPermission />
            <AdminConfig>
                <HasPermission name={"languages"}>
                    <Menu
                        parent={"settings.system"}
                        name="languages"
                        element={<Menu.Link text="Languages" to={link} />}
                    />
                </HasPermission>
            </AdminConfig>
            <LanguageEntryList />
        </>
    );
};
