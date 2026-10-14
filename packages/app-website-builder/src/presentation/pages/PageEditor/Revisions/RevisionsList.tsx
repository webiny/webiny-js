import React from "react";
import { observer } from "mobx-react-lite";
import { List, OverlayLoader } from "@webiny/admin-ui";
import RevisionListItem from "./RevisionListItem.js";
import type { Page } from "~/domain/Page/index.js";
import { useRevisionList } from "./useRevisionList.js";

interface IRevisionsListProps {
    page: Pick<Page, "id">;
}

export const RevisionsList = observer((props: IRevisionsListProps) => {
    const { page } = props;
    const { presenter } = useRevisionList(page.id);
    const { vm } = presenter;

    return (
        <div className={"relative"}>
            {(vm.isLoading || vm.isMutating) && <OverlayLoader />}
            {vm.revisions.length ? (
                <List data-testid={"cms.content-form.revisions"}>
                    {vm.revisions.map(item => (
                        <RevisionListItem item={item} key={item.revision.id} />
                    ))}
                </List>
            ) : (
                <div className={"p-lg"}>No revisions to show.</div>
            )}
        </div>
    );
});
