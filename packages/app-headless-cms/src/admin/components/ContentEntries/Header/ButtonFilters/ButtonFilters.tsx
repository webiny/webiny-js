import React from "react";

import styled from "@emotion/styled";
import { ReactComponent as FilterIcon } from "@material-design-icons/svg/outlined/filter_alt.svg";
import { ReactComponent as CloseFilterIcon } from "@material-design-icons/svg/outlined/filter_alt_off.svg";
import { IconButton } from "@webiny/ui/Button";

import { useContentEntriesList } from "~/admin/views/contentEntries/hooks";

const ButtonWrapper = styled("div")`
    margin-left: 8px;
`;

export const ButtonFilters = () => {
    const list = useContentEntriesList();

    const toggleFilters = () => {
        if (list.showingFilters) {
            list.hideFilters();
        } else {
            list.showFilters();
        }
    };

    return (
        <ButtonWrapper>
            <IconButton
                icon={list.showingFilters ? <CloseFilterIcon /> : <FilterIcon />}
                onClick={toggleFilters}
            />
        </ButtonWrapper>
    );
};
