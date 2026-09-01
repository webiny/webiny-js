import React, { useEffect, useState } from "react";
import { List, OverlayLoader } from "@webiny/admin-ui";
import RevisionListItem from "./RevisionListItem.js";
import type { Page } from "~/domain/Page/index.js";
import type { PageRevision } from "~/domain/PageRevision/index.js";
import { useGetPageRevisions } from "~/presentation/pages/hooks/useGetPageRevisions.js";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";

interface IRevisionsListProps {
    page: Pick<Page, "id">;
}

export const RevisionsList = (props: IRevisionsListProps) => {
    const { page } = props;

    const [revisions, setRevisions] = useState<PageRevision[]>([]);
    const { loading, getPageRevisions } = useGetPageRevisions();

    useEffect(() => {
        const { id: entryId } = parseIdentifier(page.id);
        getPageRevisions({
            entryId
        }).then(revisions => {
            setRevisions(
                revisions
                    .sort((a, b) => {
                        return new Date(a.savedOn).getTime() - new Date(b.savedOn).getTime();
                    })
                    .reverse()
            );
        });
    }, [page.id]);

    return (
        <div className={"relative"}>
            {loading && <OverlayLoader />}
            {revisions?.length ? (
                <List data-testid={"cms.content-form.revisions"}>
                    {revisions.map(revision => (
                        <RevisionListItem revision={revision} key={revision.id} />
                    ))}
                </List>
            ) : (
                <div className={"p-lg"}>No revisions to show.</div>
            )}
        </div>
    );
};
