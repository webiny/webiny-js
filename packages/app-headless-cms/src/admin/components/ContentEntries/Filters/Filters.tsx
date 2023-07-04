import React from "react";
import { Form, FormOnSubmit } from "@webiny/form";
import { useContentEntryListConfig } from "~/admin/config/contentEntries";
import { useContentEntriesList } from "~/admin/views/contentEntries/hooks";

import { FilterContainer, FiltersContainer, FormContainer } from "./styles";

export const Filters = () => {
    const { browser } = useContentEntryListConfig();
    const list = useContentEntriesList();

    const applyFilters: FormOnSubmit = data => {
        if (!Object.keys(data).length) {
            return;
        }
        list.setFilters(data);
    };

    if (!list.showingFilters || !browser.filters.length) {
        return null;
    }

    return (
        <FiltersContainer>
            <Form data={{}} onChange={applyFilters}>
                {() => (
                    <FormContainer>
                        {browser.filters.map(filter => (
                            <FilterContainer key={filter.name}>{filter.element}</FilterContainer>
                        ))}
                    </FormContainer>
                )}
            </Form>
        </FiltersContainer>
    );
};
