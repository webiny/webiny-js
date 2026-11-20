import React, { useEffect } from "react";
import { Heading, Scrollbar, Separator } from "@webiny/admin-ui";
import { AdminLayout, createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { HasPermission } from "~/presentation/security/HasPermission.js";
import { LayoutsListFeature } from "./feature.js";
import { NewLayoutButton } from "./NewLayoutButton.js";
import { LayoutsTable } from "./LayoutsTable.js";
import { LayoutsEmptyState } from "./LayoutsEmptyState.js";

/**
 * Layouts are built in the layout editor and picked in a page's settings, to render the page in them.
 * Each source layout is listed with its language versions.
 */
export const LayoutsList = createReactiveComponent(() => {
    const { presenter } = useFeature(LayoutsListFeature);

    useEffect(() => {
        void presenter.init();
    }, [presenter]);

    const { loading, rows } = presenter.vm;
    const isEmpty = !loading && rows.length === 0;

    return (
        <AdminLayout title={"Layouts - Website Builder"}>
            <div className={"flex flex-col h-main-content"}>
                <div className={"flex items-center justify-between py-sm px-md"}>
                    <Heading level={5}>{"Layouts"}</Heading>
                    <HasPermission entity={"page"} action={"create"}>
                        <NewLayoutButton />
                    </HasPermission>
                </div>
                <Separator />
                <div className={"flex-1 overflow-hidden"}>
                    {isEmpty ? (
                        <LayoutsEmptyState presenter={presenter} />
                    ) : (
                        <Scrollbar>
                            <LayoutsTable presenter={presenter} />
                        </Scrollbar>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
});
