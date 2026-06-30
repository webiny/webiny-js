import React from "react";
import { IconButton } from "@webiny/admin-ui";
import { useRouter } from "@webiny/app-admin";
import { ReactComponent as BackIcon } from "@webiny/icons/arrow_back.svg";
import { Routes } from "~/routes.js";

export const VariantBackButton = () => {
    const { goToRoute } = useRouter();

    return (
        <IconButton
            variant="ghost"
            size="md"
            icon={<BackIcon />}
            onClick={() => goToRoute(Routes.Pages.List)}
        />
    );
};
