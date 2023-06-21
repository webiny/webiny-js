import React from "react";
import { useFileManagerView, useFileManagerViewConfig } from "~/index";
import styled from "@emotion/styled";
import { Form, FormOnSubmit } from "@webiny/form";

const FiltersContainer = styled.div`
    width: 100%;
    height: auto;
    padding: 10px;
    background-color: var(--mdc-theme-surface);
    border-bottom: 1px solid var(--mdc-theme-on-background);
`;

export const Filters = () => {
    const { showingFilters, setFilters } = useFileManagerView();
    const { browser } = useFileManagerViewConfig();

    if (!showingFilters || !browser.filters.length) {
        return null;
    }

    const applyFilters: FormOnSubmit = data => {
        if (!Object.keys(data).length) {
            return;
        }

        setFilters(data);
    };

    return (
        <FiltersContainer>
            <Form data={{}} onChange={applyFilters}>
                {() => (
                    <>
                        {browser.filters.map(filter => (
                            <span key={filter.name}>{filter.element}</span>
                        ))}
                    </>
                )}
            </Form>
        </FiltersContainer>
    );
};
