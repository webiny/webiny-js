import React from "react";
import { List } from "@webiny/ui/List";
import Revision from "./Revision";
import { Elevation } from "@webiny/ui/Elevation";
import { css } from "emotion";
import { CircularProgress } from "@webiny/ui/Progress";
import { FbFormModel, FbRevisionModel } from "~/types";

const listWrapper = css({
    margin: 25,
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
    maxHeight: "calc(100vh - 160px)",
    ".mdc-deprecated-list .mdc-deprecated-list-item": {
        borderBottom: "1px solid var(--mdc-theme-on-background)"
    },
    ".mdc-deprecated-list .mdc-deprecated-list-item:last-child": {
        borderBottom: "none"
    }
});

interface RevisionsListProps {
    form: FbFormModel | null;
    revisions: FbRevisionModel[];
    loading: boolean;
}
export const RevisionsList = ({ form, revisions, loading }: RevisionsListProps) => {
    if (!form) {
        return null;
    }
    return (
        <Elevation className={listWrapper} z={2}>
            <div style={{ position: "relative" }}>
                {loading && <CircularProgress />}
                <List
                    nonInteractive
                    twoLine
                    data-testid={"fb.form-details.tab.revisions.content-list"}
                >
                    {Array.isArray(revisions)
                        ? revisions.map(rev => <Revision form={form} revision={rev} key={rev.id} />)
                        : null}
                </List>
            </div>
        </Elevation>
    );
};
