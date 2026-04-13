import React from "react";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { LANGUAGE_MODEL_ID } from "~/shared/constants.js";
import { GenericCell } from "~/admin/GenericCell.js";
import { Tag } from "@webiny/admin-ui";

const { Browser } = ContentEntryListConfig;

export const LanguageEntryList = () => {
    return (
        <>
            <ContentEntryListConfig>
                <Browser.Table.Column
                    name={"code"}
                    header={"Code"}
                    modelIds={[LANGUAGE_MODEL_ID]}
                    after={"name"}
                    cell={<GenericCell render={data => data.values.code} />}
                />
                <Browser.Table.Column
                    name={"enabled"}
                    header={"Is enabled?"}
                    modelIds={[LANGUAGE_MODEL_ID]}
                    after={"code"}
                    cell={
                        <GenericCell
                            render={data => {
                                const enabled = data.values.enabled;
                                const variant = enabled ? "success" : "neutral-muted";
                                return <Tag variant={variant} content={enabled ? "Yes" : "No"} />;
                            }}
                        />
                    }
                />
            </ContentEntryListConfig>
        </>
    );
};
