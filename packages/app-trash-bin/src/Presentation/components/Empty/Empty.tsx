import React from "react";
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";
import { ReactComponent as TrashIcon } from "@material-design-icons/svg/outlined/delete_forever.svg";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { EmptyOuter, EmptyWrapper } from "./Empty.styled";
import { useTrashBin } from "~/Presentation/hooks";

export const Empty = () => {
    const { vm } = useTrashBin();

    return (
        <EmptyWrapper>
            <EmptyOuter>
                {vm.isSearchView ? (
                    <EmptyView icon={<SearchIcon />} title={"No items found."} action={null} />
                ) : (
                    <EmptyView icon={<TrashIcon />} title={`No items in trash.`} action={null} />
                )}
            </EmptyOuter>
        </EmptyWrapper>
    );
};
