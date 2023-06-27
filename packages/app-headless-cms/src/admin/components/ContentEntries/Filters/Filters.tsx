import React from "react";
import { Form, FormOnSubmit } from "@webiny/form";
import { useContentEntryListConfig } from "~/admin/views/contentEntries/ContentEntryListConfig";
import { FiltersContainer } from "./styles";

interface FiltersProps {
    showingFilters: boolean;
    setFilters: (data: Record<string, any>) => void;
}

export const Filters: React.VFC<FiltersProps> = props => {
    const { browser } = useContentEntryListConfig();

    if (!props.showingFilters || !browser.filters.length) {
        return null;
    }

    const applyFilters: FormOnSubmit = data => {
        if (!Object.keys(data).length) {
            return;
        }
        props.setFilters(data);
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
