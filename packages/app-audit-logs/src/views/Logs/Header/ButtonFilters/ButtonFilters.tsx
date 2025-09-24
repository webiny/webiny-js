import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { ReactComponent as FilterIcon } from "@webiny/icons/filter_list.svg";
import { ReactComponent as CloseFilterIcon } from "@webiny/icons/filter_list_off.svg";
import { IconButton } from "@webiny/ui/Button/index.js";

const ButtonWrapper = styled("div")`
    margin-left: 8px;
`;

interface IconProps {
    showingFilters?: boolean;
}

const Icon = ({ showingFilters }: IconProps) => {
    return showingFilters ? <CloseFilterIcon /> : <FilterIcon />;
};
const IconComponent = React.memo(Icon);

type ButtonFiltersProps = {
    showingFilters: boolean;
    hideFilters: () => void;
    showFilters: () => void;
};

export const ButtonFilters = ({ showingFilters, hideFilters, showFilters }: ButtonFiltersProps) => {
    const toggleFilters = useCallback(() => {
        if (showingFilters) {
            hideFilters();
            return;
        }
        showFilters();
    }, [showingFilters]);

    return (
        <ButtonWrapper>
            <IconButton
                icon={<IconComponent showingFilters={showingFilters} />}
                onClick={toggleFilters}
                data-testid="audit-logs.toggle-filters"
            />
        </ButtonWrapper>
    );
};
