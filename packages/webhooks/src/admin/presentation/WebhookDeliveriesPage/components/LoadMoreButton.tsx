import React from "react";
import { observer } from "mobx-react-lite";
import { Button } from "@webiny/admin-ui";
import type { IWebhookDeliveriesPagePresenter } from "../abstractions.js";

interface LoadMoreButtonProps {
    presenter: IWebhookDeliveriesPagePresenter;
}

export const LoadMoreButton = observer(function LoadMoreButton({ presenter }: LoadMoreButtonProps) {
    const { vm } = presenter;

    if (!vm.list.pagination.hasMore) {
        return null;
    }

    return (
        <div className="flex justify-center pt-sm">
            <Button
                variant="secondary"
                onClick={() => void presenter.loadMore()}
                disabled={vm.list.pagination.loadingMore}
            >
                {vm.list.pagination.loadingMore ? "Loading…" : "Load more"}
            </Button>
        </div>
    );
});
