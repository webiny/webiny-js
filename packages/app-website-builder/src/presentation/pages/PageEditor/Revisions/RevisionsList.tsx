import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { List, OverlayLoader } from "@webiny/admin-ui";
import { useRouter } from "@webiny/app";
import RevisionListItem from "./RevisionListItem.js";
import type { Page } from "~/domain/Page/index.js";
import type { PageRevision } from "~/domain/PageRevision/index.js";
import { Routes } from "~/routes.js";
import { useRevisionList } from "./useRevisionList.js";
import { usePageEditorDrawer } from "./usePageEditorDrawer.js";

interface IRevisionsListProps {
    page: Pick<Page, "id">;
}

export const RevisionsList = observer((props: IRevisionsListProps) => {
    const { page } = props;
    const { presenter } = useRevisionList(page.id);
    const { goToRoute } = useRouter();
    const { openRevisionList } = usePageEditorDrawer();
    const { vm } = presenter;

    /**
     * Deleting the revision that is open in the editor would leave the editor on a revision that
     * no longer exists, so we move to the newest remaining one, or back to the list if none is left.
     */
    const onDeleted = useCallback(
        (revision: PageRevision) => {
            if (revision.id !== page.id) {
                return;
            }

            openRevisionList(false);

            const [next] = presenter.vm.revisions;
            if (!next) {
                goToRoute(Routes.Pages.List);
                return;
            }

            goToRoute(Routes.Pages.Editor, {
                id: next.revision.id
            });
        },
        [page.id, presenter, openRevisionList]
    );

    return (
        <div className={"relative"}>
            {(vm.isLoading || vm.isMutating) && <OverlayLoader />}
            {vm.revisions.length ? (
                <List data-testid={"cms.content-form.revisions"}>
                    {vm.revisions.map(item => (
                        <RevisionListItem
                            item={item}
                            key={item.revision.id}
                            onDeleted={onDeleted}
                        />
                    ))}
                </List>
            ) : (
                <div className={"p-lg"}>No revisions to show.</div>
            )}
        </div>
    );
});
