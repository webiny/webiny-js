import React, { useMemo, useState } from "react";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin/components/SplitView";
import { useSecurity } from "@webiny/app-security";
import { i18n } from "@webiny/app/i18n";
import ContentDataList from "./ContentDataList";
import ContentDetails from "./ContentDetails";

const t = i18n.ns("app-headless-cms/admin/contents/entries");

const SORTERS = [
    {
        label: t`Newest to oldest`,
        value: "savedOn_DESC"
    },
    {
        label: t`Oldest to newest`,
        value: "savedOn_ASC"
    }
];

export const ContentEntries = ({ contentModel }) => {
    const [listQueryVariables, setListQueryVariables] = useState({
        sort: SORTERS[0].value
    });
    const { identity } = useSecurity();

    const canCreate = useMemo(() => {
        const permission = identity.getPermission("cms.contentEntry");
        if (!permission) {
            return false;
        }

        if (typeof permission.rwd !== "string") {
            return true;
        }

        return permission.rwd.includes("w");
    }, []);

    // Generate sorters based on current content model
    const sorters = useMemo(() => {
        const titleField = contentModel.fields.find(
            field => field.fieldId === contentModel.titleFieldId
        );
        const titleFieldLabel = titleField ? titleField.label : null;
        if (!titleFieldLabel) {
            return SORTERS;
        }

        return [
            ...SORTERS,
            {
                label: t`{titleFieldLabel} A-Z`({ titleFieldLabel }),
                value: `${contentModel.titleFieldId}_ASC`
            },
            {
                label: t`{titleFieldLabel} Z-A`({ titleFieldLabel }),
                value: `${contentModel.titleFieldId}_DESC`
            }
        ];
    }, [contentModel]);

    return (
        <SplitView>
            <LeftPanel span={4}>
                <ContentDataList
                    listQueryVariables={listQueryVariables}
                    setListQueryVariables={setListQueryVariables}
                    contentModel={contentModel}
                    canCreate={canCreate}
                    sorters={sorters}
                />
            </LeftPanel>
            <RightPanel span={8}>
                <ContentDetails
                    listQueryVariables={listQueryVariables}
                    contentModel={contentModel}
                    canCreate={canCreate}
                />
            </RightPanel>
        </SplitView>
    );
};
