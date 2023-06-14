import React from "react";
import { useFileManagerView, useFileManagerViewConfig } from "~/index";
import styled from "@emotion/styled";
import { Form, FormOnSubmit } from "@webiny/form";

const FiltersContainer = styled.div`
    width: 100%;
    height: 40px;
    padding: 5px;
    background-color: var(--mdc-theme-surface);
    border-bottom: 1px solid var(--mdc-theme-on-background);
`;

export const Filters = () => {
    const { showingFilters, setFilters } = useFileManagerView();
    const { browser } = useFileManagerViewConfig();
    const filters = browser.filters || [];

    if (!showingFilters) {
        return null;
    }

    const applyFilters: FormOnSubmit = data => {
        setFilters(data);
    };

    return (
        <FiltersContainer>
            <Form data={{}} onChange={applyFilters}>
                {() => (
                    <>
                        {filters.map(filter => (
                            <span key={filter.name}>{filter.element}</span>
                        ))}
                    </>
                )}
            </Form>
        </FiltersContainer>
    );
};
