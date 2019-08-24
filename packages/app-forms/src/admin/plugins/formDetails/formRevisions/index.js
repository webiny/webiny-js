// @flow
import * as React from "react";
import type { FormDetailsPluginType } from "@webiny/app-forms/types";
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
}: FormDetailsPluginType);
