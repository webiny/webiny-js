import React, { useCallback } from "react";
import styled from "@emotion/styled";

import { ReactComponent as FilterIcon } from "@material-design-icons/svg/outlined/filter_alt.svg";
import { ReactComponent as CloseFilterIcon } from "@material-design-icons/svg/outlined/filter_alt_off.svg";
import { IconButton } from "@webiny/ui/Button";

const ButtonWrapper = styled("div")`
    margin-left: 8px;
`;

interface IconProps {
    showingFilters?: boolean;
}

const Icon: React.VFC<IconProps> = ({ showingFilters }) => {
    return showingFilters ? <CloseFilterIcon /> : <FilterIcon />;
};
const IconComponent = React.memo(Icon);

type ButtonFiltersProps = {
    showingFilters: boolean;
    hideFilters: () => void;
    showFilters: () => void;
};

export const ButtonFilters: React.FC<ButtonFiltersProps> = ({
    showingFilters,
    hideFilters,
    showFilters
}) => {
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
