import { useRecords } from "@webiny/app-aco";
import { useSnackbar } from "@webiny/app-admin";
import { useDuplicatePageCase } from "./useDuplicatePageCase";
import { PbPageData } from "~/types";
import { PageItem } from "./types";

interface UseDuplicatePageParams {
    page: PageItem;
    onSuccess?: (page: PbPageData) => void;
}

export const useDuplicatePage = () => {
    const { duplicatePage: duplicatePageMutation } = useDuplicatePageCase();
    const { showSnackbar } = useSnackbar();
    const { getRecord } = useRecords();

    const duplicatePage = async ({ page, onSuccess }: UseDuplicatePageParams) => {
        try {
            const data = await duplicatePageMutation({ page });

            showSnackbar(`The page "${page.title}" was duplicated successfully.`);

            // Sync ACO record - retrieve the new record from network
            await getRecord(data.pid);

            if (typeof onSuccess === "function") {
                onSuccess(data);
            }
        } catch (error) {
            showSnackbar(error);
        }
    };

    return {
        duplicatePage
    };
};
