import React, { useCallback } from "react";
import { ReactComponent as Duplicate } from "@material-design-icons/svg/outlined/library_add.svg";
import { makeDecoratable } from "@webiny/react-composition";
import { PageListConfig } from "~/admin/config/pages";
import { usePage } from "~/admin/views/Pages/hooks/usePage";
import { useDuplicatePage } from "~/admin/views/Pages/hooks/useDuplicatePage";

export const DuplicatePage = makeDecoratable("TableActionDuplicatePage", () => {
    const { page } = usePage();
    const { duplicatePage } = useDuplicatePage();
    const { OptionsMenuItem } = PageListConfig.Browser.PageAction;

    const onAction = useCallback(async () => {
        await duplicatePage({ page });
    }, [page]);

    return (
        <OptionsMenuItem
            icon={<Duplicate />}
            label={"Duplicate"}
            onAction={onAction}
            data-testid={"aco.actions.pb.page.duplicate"}
        />
    );
});
