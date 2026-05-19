import { useAdminUi } from "@webiny/admin-ui";

export const useFileUrlFormatter = () => {
    return useAdminUi().fileUrlFormatter;
};
