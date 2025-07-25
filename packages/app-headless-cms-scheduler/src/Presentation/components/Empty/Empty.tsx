import React from "react";
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";
import { ReactComponent as ListIcon } from "@material-design-icons/svg/outlined/view_list.svg";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { EmptyOuter, EmptyWrapper } from "./Empty.styled";
import { useScheduler } from "~/Presentation/hooks";

export const Empty = () => {
    const { vm } = useScheduler();

    return (
        <EmptyWrapper>
            <EmptyOuter>
                {vm.isSearchView ? (
                    <EmptyView icon={<SearchIcon />} title={"No items found."} action={null} />
                ) : (
                    <EmptyView icon={<ListIcon />} title={`No scheduled items.`} action={null} />
                )}
            </EmptyOuter>
        </EmptyWrapper>
    );
};
