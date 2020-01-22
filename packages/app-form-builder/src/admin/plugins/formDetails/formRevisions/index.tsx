import * as React from "react";
import { FbFormDetailsPluginType } from "@webiny/app-form-builder/types";
import { Tab } from "@webiny/ui/Tabs";
import RevisionsList from "./RevisionsList";

export default ({
    name: "forms-form-details-revision-content-revisions",
    type: "forms-form-details-revision-content",
    render({ form, loading }) {
        return (
            <Tab label={"Revisions"} disabled={loading}>
                <RevisionsList form={form} loading={loading} />
            </Tab>
        );
    }
} as FbFormDetailsPluginType);
