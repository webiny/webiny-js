import React from "react";
import { List, OverlayLoader } from "@webiny/admin-ui";
import RevisionListItem from "./RevisionListItem.js";
import type { Page } from "~/domain/Page/index.js";
import { useRevisionList } from "./useRevisionList.js";

interface IRevisionsListProps {
    page: Pick<Page, "id">;
}

export const RevisionsList = (props: IRevisionsListProps) => {
    const { page } = props;
    const { vm } = useRevisionList(page.id);

    return (
        <div className={"relative"}>
            {(vm.isLoading || vm.isMutating) && <OverlayLoader />}
            {vm.revisions.length ? (
                <List data-testid={"cms.content-form.revisions"}>
                    {vm.revisions.map(revision => (
                        <RevisionListItem revision={revision} key={revision.id} />
                    ))}
                </List>
            ) : (
                <div className={"p-lg"}>No revisions to show.</div>
            )}
        </div>
    );
};
