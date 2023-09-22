import React from "react";
import { PageListConfig } from "~/admin/config/pages";

import {
    ActionDelete,
    ActionExport,
    ActionMove,
    ActionPublish,
    ActionUnpublish
} from "~/admin/components/BulkActions";

const { Browser } = PageListConfig;

export const PagesModule: React.FC = () => {
    return (
        <>
            <PageListConfig>
                <Browser.BulkAction name={"export"} element={<ActionExport />} />
                <Browser.BulkAction name={"publish"} element={<ActionPublish />} />
                <Browser.BulkAction name={"unpublish"} element={<ActionUnpublish />} />
                <Browser.BulkAction name={"move"} element={<ActionMove />} />
                <Browser.BulkAction name={"delete"} element={<ActionDelete />} />
            </PageListConfig>
        </>
    );
};
