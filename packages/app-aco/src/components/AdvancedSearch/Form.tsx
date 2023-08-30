import React, { useEffect, useState } from "react";

import { observer } from "mobx-react-lite";
import { ButtonPrimary } from "@webiny/ui/Button";

import { FilterManager } from "./FilterManager";
import { Row } from "./Row";

import { Field, Filter } from "./types";

interface FormProps {
    fields: Field[];
}

const Form: React.VFC<FormProps> = ({ fields }) => {
    const [filterManager] = useState(new FilterManager());

    useEffect(() => {
        filterManager.createFilter();

        return () => {
            filterManager.deleteAllFilters();
        };
    }, []);

    const onChange = (id: string, data: Filter) => {
        filterManager.updateFilter({
            ...data,
            id
        });
    };

    const onSubmit = () => {
        const filters = filterManager.listFilters();
        console.log("filters", filters);
        const filtersOutput = filterManager.getFiltersOutput();
        console.log("filtersOutput", JSON.stringify(filtersOutput));
    };

    return (
        <>
            {filterManager.listFilters().map(filter => (
                <Row
                    key={filter.id}
                    id={filter.id}
                    fields={fields}
                    onRemove={() => filterManager.deleteFilter(filter.id)}
                    onChange={onChange}
                />
            ))}
            <ButtonPrimary
                onClick={() => {
                    filterManager.createFilter();
                }}
            >
                Add a field
            </ButtonPrimary>

            <ButtonPrimary onClick={onSubmit}>Return fields</ButtonPrimary>
        </>
    );
};

export default observer(Form);
