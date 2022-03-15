import React from "react";
import { FbFormDetailsPluginType } from "~/types";
import { Tab } from "@webiny/ui/Tabs";
import { RevisionsList } from "./RevisionsList";

const plugin: FbFormDetailsPluginType = {
    name: "forms-form-details-revision-content-revisions",
    type: "forms-form-details-revision-content",
    render({ form, revisions, loading }) {
        return (
            <Tab
                label={"Revisions"}
                disabled={loading}
                data-testid={"fb.form-details.tab.revisions"}
            >
                <RevisionsList form={form} revisions={revisions} loading={loading} />
            </Tab>
        );
    }
};

export default plugin;
