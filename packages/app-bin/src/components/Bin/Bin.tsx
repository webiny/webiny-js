import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { OverlayLayout } from "@webiny/app-admin";
import { IBinRepository } from "~/abstractions";
import { BinListQueryVariables } from "~/types";
import { BinPresenter } from "./BinPresenter";
import { Table } from "~/components/Table";
import { BinController } from "~/components/Bin/BinController";

export interface BinProps {
    onExited: () => void;
    repository: IBinRepository<any>;
}

export const Bin = observer((props: BinProps) => {
    const presenter = useMemo<BinPresenter<BinListQueryVariables>>(() => {
        return new BinPresenter<BinListQueryVariables>(props.repository);
    }, [props.repository]);

    const controller = useMemo<BinController<BinListQueryVariables>>(() => {
        return new BinController<BinListQueryVariables>(props.repository);
    }, [props.repository]);

    useEffect(() => {
        presenter.load();
    }, []);

    return (
        <OverlayLayout onExited={props.onExited}>
            <Table vm={presenter.vm} onEntryDelete={id => controller.deleteEntry(id)} />
        </OverlayLayout>
    );
});
