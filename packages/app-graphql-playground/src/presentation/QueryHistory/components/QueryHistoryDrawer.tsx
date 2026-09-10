import React from "react";
import { observer } from "mobx-react-lite";
import { Drawer } from "@webiny/admin-ui";
import { QueryHistoryList } from "./QueryHistoryList.js";
import type { QueryHistoryPresenter } from "../abstractions.js";
import type { PlaygroundPresenter } from "../../Playground/abstractions.js";

interface QueryHistoryDrawerProps {
    presenter: QueryHistoryPresenter.Interface;
    playgroundPresenter: PlaygroundPresenter.Interface;
}

export const QueryHistoryDrawer = observer((props: QueryHistoryDrawerProps) => {
    const { presenter, playgroundPresenter } = props;

    const handleRestore = (entry: QueryHistoryPresenter.EntryVm) => {
        playgroundPresenter.restoreFromHistory(entry.query, entry.variables);
    };

    const handleOpenInNewTab = (entry: QueryHistoryPresenter.EntryVm) => {
        playgroundPresenter.restoreFromHistoryInNewTab(
            entry.query,
            entry.variables,
            entry.endpoint,
            entry.definitionId
        );
    };

    return (
        <Drawer
            title="Query History"
            open={presenter.vm.open}
            onOpenChange={open => {
                if (open) {
                    return;
                }
                presenter.toggle();
            }}
            modal={false}
            bodyPadding={false}
            headerSeparator={true}
            width={"40%"}
        >
            <QueryHistoryList
                presenter={presenter}
                onRestore={handleRestore}
                onOpenInNewTab={handleOpenInNewTab}
            />
        </Drawer>
    );
});
