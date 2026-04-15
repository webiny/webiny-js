import React from "react";
import { Separator } from "@webiny/admin-ui";
import type { FormOnSubmit, FormProps, GenericFormData } from "@webiny/form";
import { Form } from "@webiny/form";

type Filter = {
    name: string;
    element: React.ReactElement;
};

export type GenericFiltersData = GenericFormData;

export type FiltersOnSubmit<T extends GenericFiltersData = GenericFiltersData> = FormOnSubmit<T>;

export interface FiltersProps<T extends GenericFormData = GenericFormData> extends Pick<
    FormProps<T>,
    "data" | "onChange"
> {
    filters: Filter[];
    show: boolean;
    children?: React.ReactNode;
    ["data-testid"]?: string;
}

export const Filters = <T extends GenericFiltersData = GenericFiltersData>(
    props: FiltersProps<T>
) => {
    if (!props.show || !props.filters.length) {
        return null;
    }

    return (
        <>
            <div
                className={"w-full bg-neutral-base px-md my-sm"}
                data-testid={props["data-testid"] || "filters-container"}
            >
                <Form data={props.data} onChange={props.onChange}>
                    {() => (
                        <div className={"w-full flex gap-sm flex-wrap"}>
                            {props.filters.map(filter => (
                                <div key={filter.name}>{filter.element}</div>
                            ))}
                            {props.children}
                        </div>
                    )}
                </Form>
            </div>
            <Separator />
        </>
    );
};
