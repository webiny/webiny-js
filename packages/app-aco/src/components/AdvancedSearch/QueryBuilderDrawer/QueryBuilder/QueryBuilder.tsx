import React, { Fragment, useEffect } from "react";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete_outline.svg";

import { Accordion } from "@webiny/admin-ui";
import type { FormAPI, FormOnSubmit } from "@webiny/form";
import { Form } from "@webiny/form";

import type {
    QueryBuilderFormData,
    QueryBuilderViewModel
} from "../QueryBuilderDrawerPresenter.js";

import {
    AddFilter,
    AddGroup,
    Details,
    Filter,
    FilterOperationLabel,
    GroupOperationLabel,
    OperationSelector
} from "./components/index.js";

import type { FieldDTOWithElement } from "~/components/AdvancedSearch/domain/index.js";

export interface QueryBuilderProps {
    onForm: (form: FormAPI) => void;
    onSubmit: FormOnSubmit<QueryBuilderFormData>;
    onChange: (data: QueryBuilderFormData) => void;
    onDeleteGroup: (groupIndex: number) => void;
    onSetFilterFieldData: (groupIndex: number, filterIndex: number, data: string) => void;
    onDeleteFilterFromGroup: (groupIndex: number, filterIndex: number) => void;
    onAddNewFilterToGroup: (groupIndex: number) => void;
    onAddGroup: () => void;
    fields: FieldDTOWithElement[];
    vm: QueryBuilderViewModel;
}

export const QueryBuilder = (props: QueryBuilderProps) => {
    const formRef = React.createRef<FormAPI>();

    useEffect(() => {
        if (formRef.current) {
            props.onForm(formRef.current);
        }
    }, []);

    return (
        <div className={"wby-py-lg"}>
            <Form
                ref={formRef}
                data={props.vm.data}
                onChange={props.onChange}
                onSubmit={props.onSubmit}
                invalidFields={props.vm.invalidFields}
            >
                {() => (
                    <>
                        <Details name={props.vm.name} description={props.vm.description} />
                        <Accordion variant={"container"}>
                            {props.vm.data.groups.map((group, groupIndex, groups) => (
                                <Accordion.Item
                                    className={"wby-relative"}
                                    title={group.title}
                                    defaultOpen={group.open}
                                    key={`group-${groupIndex}`}
                                    actions={
                                        <>
                                            <div className={"wby-mt-xxs wby-mr-xs-plus"}>
                                                <OperationSelector
                                                    label={"Match all conditions"}
                                                    name={`groups.${groupIndex}.operation`}
                                                />
                                            </div>
                                            <Accordion.Item.Action
                                                icon={<DeleteIcon />}
                                                onClick={() => props.onDeleteGroup(groupIndex)}
                                                disabled={!group.canDelete}
                                            />
                                        </>
                                    }
                                >
                                    {group.filters.map((filter, filterIndex, filters) => (
                                        <Fragment key={filterIndex}>
                                            <Filter
                                                name={`groups.${groupIndex}.filters.${filterIndex}`}
                                                filter={filter}
                                                fields={props.fields}
                                                onFieldSelectChange={data =>
                                                    props.onSetFilterFieldData(
                                                        groupIndex,
                                                        filterIndex,
                                                        data
                                                    )
                                                }
                                                onDelete={() => {
                                                    props.onDeleteFilterFromGroup(
                                                        groupIndex,
                                                        filterIndex
                                                    );
                                                }}
                                            />
                                            <FilterOperationLabel
                                                show={filters.length !== filterIndex + 1}
                                                operation={group.operation}
                                            />
                                        </Fragment>
                                    ))}
                                    <AddFilter
                                        onClick={() => props.onAddNewFilterToGroup(groupIndex)}
                                    />
                                    <GroupOperationLabel
                                        show={groups.length !== groupIndex + 1}
                                        operation={props.vm.data.operation}
                                    />
                                </Accordion.Item>
                            ))}
                        </Accordion>
                        <AddGroup onClick={() => props.onAddGroup()} />
                    </>
                )}
            </Form>
        </div>
    );
};
