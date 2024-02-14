import * as React from "react";
import { renderPlugins } from "@webiny/app/plugins";
import { Tab } from "@webiny/ui/Tabs";
import styled from "@emotion/styled";
import { CircularProgress } from "@webiny/ui/Progress";
import { FbFormDetailsPluginType, FbFormDetailsSubmissionsPlugin } from "../../../../types";
import { i18n } from "@webiny/app/i18n";
import { FormSubmissionsOverview } from "./FormSubmissionsOverview";
import { FormSubmissionsList } from "./FormSubmissionsList";

const t = i18n.namespace("FormsApp.FormDetails.PreviewContent");

const RenderBlock = styled("div")({
    padding: 25
});

export default [
    {
        name: "forms-form-details-revision-content-submissions",
        type: "forms-form-details-revision-content",
        render({ form, stats, loading, security }) {
            const { getPermissions } = security;

            const fbFormPermissions = getPermissions("fb.form");
            if (!fbFormPermissions.length) {
                return null;
            }

            let hasAccessToSubmissions = false;
            for (let i = 0; i < fbFormPermissions.length; i++) {
                const { submissions } = fbFormPermissions[i];
                if (typeof submissions == "undefined" || submissions === true) {
                    hasAccessToSubmissions = true;
                    break;
                }
            }

            if (!hasAccessToSubmissions) {
                return null;
            }

            return (
                <Tab
                    label={t`Submissions`}
                    disabled={loading}
                    data-testid={"fb.form-details.tab.submissions"}
                >
                    <RenderBlock>
                        <div style={{ position: "relative" }}>
                            {loading && <CircularProgress />}
                            {form &&
                                stats &&
                                renderPlugins("forms-form-details-submissions", {
                                    form,
                                    stats
                                })}
                        </div>
                    </RenderBlock>
                </Tab>
            );
        }
    } as FbFormDetailsPluginType,
    {
        name: "forms-form-details-submissions-overview",
        type: "forms-form-details-submissions",
        render({ stats }) {
            return <FormSubmissionsOverview stats={stats} />;
        }
    } as FbFormDetailsSubmissionsPlugin,
    {
        name: "forms-form-details-submissions-list",
        type: "forms-form-details-submissions",
        render({ form }) {
            return <FormSubmissionsList form={form} />;
        }
    } as FbFormDetailsSubmissionsPlugin
];
