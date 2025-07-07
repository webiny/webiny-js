import React from "react";
import { Button, Separator } from "@webiny/admin-ui";
import {
    useCreatePageRevisionFrom,
    useDeletePage,
    useDuplicatePage,
    useListPages,
    useMovePage,
    usePublishPage,
    useUnpublishPage,
    useUpdatePage
} from "~/features/pages/index.js";

export const DocumentList = () => {
    const { pages, listPages } = useListPages();
    const { updatePage } = useUpdatePage();
    const { publishPage } = usePublishPage();
    const { unpublishPage } = useUnpublishPage();
    const { duplicatePage } = useDuplicatePage();
    const { movePage } = useMovePage();
    const { createPageRevisionFrom } = useCreatePageRevisionFrom();
    const { deletePage } = useDeletePage();

    React.useEffect(() => {
        listPages({
            folderId: "folder-1"
        });
    }, []);

    return (
        <>
            {pages.map(page => (
                <div key={page.entryId}>
                    <p>Id {page.id}</p>
                    <p>EntryId {page.entryId}</p>
                    <p>CreatedOn {page.createdOn}</p>
                    <p>CreatedyBy {JSON.stringify(page.createdBy)}</p>
                    <p>SavedOn {page.savedOn}</p>
                    <p>Status {page.status}</p>
                    <p>Version {page.version}</p>
                    <p>FolderId {page.location.folderId}</p>
                    <p>
                        <Button
                            text={"Update title"}
                            onClick={() =>
                                updatePage({
                                    id: page.id,
                                    entryId: page.entryId,
                                    properties: {
                                        ...page.properties,
                                        title: page.entryId + " Updated"
                                    }
                                })
                            }
                        />
                        <Button
                            text={"Publish"}
                            onClick={() =>
                                publishPage({
                                    id: page.id,
                                    entryId: page.entryId
                                })
                            }
                        />
                        <Button
                            text={"Unpublish"}
                            onClick={() =>
                                unpublishPage({
                                    id: page.id,
                                    entryId: page.entryId
                                })
                            }
                        />
                        <Button
                            text={"Unpublish"}
                            onClick={() =>
                                unpublishPage({
                                    id: page.id,
                                    entryId: page.entryId
                                })
                            }
                        />
                        <Button
                            text={"Unpublish"}
                            onClick={() =>
                                unpublishPage({
                                    id: page.id,
                                    entryId: page.entryId
                                })
                            }
                        />
                        <Button
                            text={"Duplicate"}
                            onClick={() =>
                                duplicatePage({
                                    id: page.id,
                                    entryId: page.entryId
                                })
                            }
                        />
                        <Button
                            text={"Move"}
                            onClick={() =>
                                movePage({
                                    id: page.id,
                                    folderId: "folder-2"
                                })
                            }
                        />
                        <Button
                            text={"Create revision"}
                            onClick={() =>
                                createPageRevisionFrom({
                                    id: page.id,
                                    entryId: page.entryId
                                })
                            }
                        />
                        <Button
                            text={"Delete"}
                            onClick={() =>
                                deletePage({
                                    id: page.id,
                                    entryId: page.entryId
                                })
                            }
                        />
                    </p>
                    <Separator />
                </div>
            ))}
        </>
    );
};
