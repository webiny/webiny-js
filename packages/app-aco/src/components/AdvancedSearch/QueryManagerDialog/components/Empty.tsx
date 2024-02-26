import React from "react";

import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";
import EmptyView from "@webiny/app-admin/components/EmptyView";

import { EmptyContainer, EmptyIconContainer } from "../QueryManagerDialog.styled";

export const Empty = () => {
    return (
        <EmptyContainer>
            <EmptyView
                icon={
                    <EmptyIconContainer>
                        <SearchIcon />
                    </EmptyIconContainer>
                }
                title={"No filters found."}
                action={null}
            />
        </EmptyContainer>
    );
};
