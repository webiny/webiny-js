import React, { useEffect, useState } from "react";

import { observer } from "mobx-react-lite";
import { ButtonPrimary } from "@webiny/ui/Button";

import { FilterManager } from "./FilterManager";
import { Row } from "./Row";

import { Field } from "./types";

interface FormProps {
    fields: Field[];
}

const Form: React.VFC<FormProps> = ({ fields }) => {
    const [filterManager] = useState(new FilterManager());

    useEffect(() => {
        filterManager.addFilter();

        return () => {
            filterManager.removeAllFilters();
        };
    }, []);

    const onChange = (id: string, data: any) => {
        filterManager.updateFilter({
            id,
            ...data
        });
    };

    const onSubmit = () => {
        const filters = filterManager.getFilters();
        console.log("filters", filters);
        const filtersOutput = filterManager.getFiltersOutput();
        console.log("filtersOutput", filtersOutput);
    };

    return (
        <>
            {filterManager.getFilters().map((filter, index) => (
                <Row
                    position={index}
                    key={filter.id}
                    id={filter.id}
                    fields={fields}
                    onRemove={() => filterManager.removeFilter(filter.id)}
                    onChange={onChange}
                />
            ))}
            <ButtonPrimary
                onClick={() => {
                    filterManager.addFilter();
                }}
            >
                Add a field
            </ButtonPrimary>

            <ButtonPrimary onClick={onSubmit}>Return fields</ButtonPrimary>
        </>
    );
};

export default observer(Form);
