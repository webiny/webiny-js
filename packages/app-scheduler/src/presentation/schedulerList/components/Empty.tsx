import React from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";
import { ReactComponent as ListIcon } from "@material-design-icons/svg/outlined/view_list.svg";
import { EmptyView } from "@webiny/app-admin";
import { EmptyOuter, EmptyWrapper } from "~/presentation/components/Empty/Empty.styled.js";
import type { ISchedulerListPresenter } from "../abstractions.js";

interface EmptyProps {
    presenter: ISchedulerListPresenter;
}

export const Empty = observer(({ presenter }: EmptyProps) => {
    const { vm } = presenter.list;

    return (
        <EmptyWrapper>
            <EmptyOuter>
                {vm.emptyWithFilters ? (
                    <EmptyView icon={<SearchIcon />} title={"No items found."} action={null} />
                ) : (
                    <EmptyView icon={<ListIcon />} title={`No scheduled items.`} action={null} />
                )}
            </EmptyOuter>
        </EmptyWrapper>
    );
});
