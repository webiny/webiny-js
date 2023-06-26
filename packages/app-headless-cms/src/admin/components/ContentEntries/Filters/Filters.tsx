import React from "react";

import { Form, FormOnSubmit } from "@webiny/form";

import { useContentEntriesViewConfig } from "~/admin/views/contentEntries/ContentEntriesViewConfig";

import { FiltersContainer } from "./styles";

export const Filters = () => {
    const { browser } = useContentEntriesViewConfig();

    if (!browser.filters.length) {
        return null;
    }

    // if (!props.show) {
    //     return null;
    // }

    const applyFilters: FormOnSubmit = data => {
        if (!Object.keys(data).length) {
            return;
        }

        console.log("data", data);
        //setFilters(data);
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
