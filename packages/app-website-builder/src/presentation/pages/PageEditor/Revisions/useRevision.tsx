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
import { useSnackbar } from "@webiny/app-admin";

export interface UseRevisionProps {
    revision: PageRevision;
}

export const useRevision = (props: UseRevisionProps) => {
    const { revision } = props;

    const { goToRoute } = useRouter();
    const { showSnackbar } = useSnackbar();

    const { createPageRevisionFrom } = useCreatePageRevisionFrom();
    const { deletePageRevision } = useDeletePageRevision();
    const { publishPage } = usePublishPage();
    const { unpublishPage } = useUnpublishPage();

    const createRevision = useCallback(() => {
        createPageRevisionFrom({
            id: revision.id
        });
    }, [revision.id]);

    const deleteRevision = useCallback(async () => {
        try {
            const deleted = await deletePageRevision({ id: revision.id });
            if (!deleted) {
                return;
            }
        } catch (error) {
            showSnackbar(error.message);
        }
    }, [revision.id, deletePageRevision, showSnackbar]);

    const publishRevision = useCallback(() => {
        publishPage({
            id: revision.id
        });
    }, [revision.id]);

    const unpublishRevision = useCallback(() => {
        unpublishPage({
            id: revision.id
        });
    }, [revision.id]);

    const editRevision = useCallback(() => {
        goToRoute(Routes.Pages.Editor, {
            id: revision.id
        });
    }, [revision.id]);

    return {
        createRevision,
        editRevision,
        deleteRevision,
        publishRevision,
        unpublishRevision
    };
};
