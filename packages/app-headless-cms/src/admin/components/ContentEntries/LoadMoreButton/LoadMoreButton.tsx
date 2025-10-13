import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { Button } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/components/content-entries/load-more-button");

interface LoadMoreButtonProps {
    windowHeight: number;
    tableHeight: number;
    onClick: () => void;
    disabled?: boolean;
    show: boolean;
}

export const LoadMoreButton = ({
    disabled,
    windowHeight,
    tableHeight,
    show,
    onClick
}: LoadMoreButtonProps) => {
    if (!show || windowHeight <= tableHeight) {
        return null;
    }

    return (
        <div className={"flex text-center mt-md"}>
            <Button onClick={onClick} disabled={disabled} text={t`Load more entries`} />
        </div>
    );
};
