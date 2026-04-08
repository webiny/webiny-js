import React from "react";
import { InternalPageListConfig } from "./configs/list/index.js";
import { HasPermission } from "~/presentation/security/HasPermission.js";
import { TranslatePageAction } from "./TranslatePageAction.js";

const { Browser } = InternalPageListConfig;

export const TranslatePageConfig = () => {
    return (
        <InternalPageListConfig>
            <HasPermission entity="page" action="create">
                <Browser.Page.Action name="translate" element={<TranslatePageAction />} />
            </HasPermission>
        </InternalPageListConfig>
    );
};
