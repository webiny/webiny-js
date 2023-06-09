import React from "react";
import { useFileManagerAcoView } from "~/modules/FileManagerRenderer/FileManagerAcoViewProvider";
import styled from "@emotion/styled";
import { useFileManagerViewConfig } from "~/modules/FileManagerRenderer/AcoRenderer/FileManagerViewConfig";

const FiltersContainer = styled.div`
    width: 100%;
    height: 40px;
    padding: 5px;
    background-color: var(--mdc-theme-surface);
    border-bottom: 1px solid var(--mdc-theme-on-background);
`;

export const Filters = () => {
    const { showingFilters } = useFileManagerAcoView();
    const { browser } = useFileManagerViewConfig();
    const filters = browser.filters || [];

    if (!showingFilters) {
        return null;
    }

    return (
        <FiltersContainer>
            {filters.map(filter => (
                <span key={filter.name}>{filter.element}</span>
            ))}
        </FiltersContainer>
    );
};
