import React, { useCallback } from "react";
import { ReactComponent as FilterIcon } from "@webiny/icons/filter_list.svg";
import { ReactComponent as CloseFilterIcon } from "@webiny/icons/filter_list_off.svg";
import { IconButton } from "@webiny/admin-ui";

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
        <div className={"ml-sm"}>
            <IconButton
                variant={"secondary"}
                icon={<IconComponent showingFilters={showingFilters} />}
                onClick={toggleFilters}
                data-testid="audit-logs.toggle-filters"
            />
        </div>
    );
};
