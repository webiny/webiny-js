import type { PageRevision } from "~/domain/PageRevision/index.js";
import {
    usePublishPage,
    useUnpublishPage,
    useCreatePageRevisionFrom,
    useDeletePageRevision
} from "~/features/pages/index.js";
import { useCallback } from "react";
import { Routes } from "~/routes.js";
import { useRouter } from "@webiny/app";
import { usePageEditorDrawer } from "./usePageEditorDrawer.js";

export interface UseRevisionProps {
    revision: PageRevision;
}

export const useRevision = (props: UseRevisionProps) => {
    const { revision } = props;

    const { goToRoute } = useRouter();
    const { openRevisionList } = usePageEditorDrawer();

    const { createPageRevisionFrom } = useCreatePageRevisionFrom();
    const { deletePageRevision } = useDeletePageRevision();
    const { publishPage } = usePublishPage();
    const { unpublishPage } = useUnpublishPage();

    const createRevision = useCallback(async () => {
        await createPageRevisionFrom({
            id: revision.id
        });
    }, [revision.id]);

    const deleteRevision = useCallback(async () => {
        await deletePageRevision({
            id: revision.id
        });
    }, [revision.id]);

    const publishRevision = useCallback(async () => {
        await publishPage({
            id: revision.id
        });
    }, [revision.id]);

    const unpublishRevision = useCallback(async () => {
        await unpublishPage({
            id: revision.id
        });
    }, [revision.id]);

    const editRevision = useCallback(() => {
        // The drawer lives outside the editor, so it would stay open across the navigation.
        openRevisionList(false);

        goToRoute(Routes.Pages.Editor, {
            id: revision.id
        });
    }, [revision.id, openRevisionList]);

    return {
        createRevision,
        editRevision,
        deleteRevision,
        publishRevision,
        unpublishRevision
    };
};
