import React, { useEffect } from "react";
import { Heading, Text } from "@webiny/admin-ui";
import { AdminLayout, createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { HasPermission } from "~/presentation/security/HasPermission.js";
import { LayoutsListFeature } from "./feature.js";
import { NewLayoutButton } from "./NewLayoutButton.js";
import { LAYOUT_ROW_GRID, LayoutRow } from "./LayoutRow.js";
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

    const { rows } = presenter.vm;

    return (
        <AdminLayout title={"Layouts - Website Builder"}>
            <div className={"mx-auto w-full max-w-[1100px] p-lg"}>
                <div className={"flex items-center justify-between mb-md"}>
                    <div>
                        <Heading level={4}>Layouts</Heading>
                        <Text size={"sm"} className={"text-neutral-muted"}>
                            {
                                "Build the layout pages are rendered in: headers, footers and other elements around the page content. Publish it, and pick it in a page's settings."
                            }
                        </Text>
                    </div>
                    <HasPermission entity={"page"} action={"create"}>
                        <NewLayoutButton />
                    </HasPermission>
                </div>
                <div className={"bg-neutral-base rounded-lg border-sm border-neutral-dimmed"}>
                    <LayoutsEmptyState presenter={presenter} />
                    {rows.length ? (
                        <div
                            className={`${LAYOUT_ROW_GRID} px-md py-sm border-b-sm border-neutral-dimmed`}
                        >
                            <Text size={"sm"} className={"text-neutral-muted"}>
                                {"Title"}
                            </Text>
                            <Text size={"sm"} className={"text-neutral-muted"}>
                                {"Slug"}
                            </Text>
                            <Text size={"sm"} className={"text-neutral-muted"}>
                                {"Language"}
                            </Text>
                            <Text size={"sm"} className={"text-neutral-muted"}>
                                {"Status"}
                            </Text>
                            <Text size={"sm"} className={"text-neutral-muted"}>
                                {"Version"}
                            </Text>
                            <span />
                        </div>
                    ) : null}
                    {rows.map(row => (
                        <LayoutRow key={row.layout.entryId} presenter={presenter} row={row} />
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
});
