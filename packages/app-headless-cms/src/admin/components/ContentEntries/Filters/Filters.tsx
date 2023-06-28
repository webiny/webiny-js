import React from "react";
import { Form, FormOnSubmit } from "@webiny/form";
import { useContentEntryListConfig } from "~/admin/config/contentEntries";
import { useContentEntriesList } from "~/admin/views/contentEntries/hooks";

import { FiltersContainer } from "./styles";

export const Filters = () => {
    const { browser } = useContentEntryListConfig();
    const list = useContentEntriesList();

    if (!list.showingFilters || !browser.filters.length) {
        return null;
    }

    const applyFilters: FormOnSubmit = data => {
        if (!Object.keys(data).length) {
            return;
        }
        list.setFilters(data);
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
