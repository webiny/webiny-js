import React, { Fragment, useEffect } from "react";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";

import { Accordion, AccordionItem } from "@webiny/ui/Accordion";
import { Form, FormAPI, FormOnSubmit } from "@webiny/form";

import { QueryBuilderFormData, QueryBuilderViewModel } from "../QueryBuilderDrawerPresenter";

import {
    AddFilter,
    AddGroup,
    Details,
    Filter,
    FilterOperationLabel,
    GroupOperationLabel,
    OperationSelector
} from "./components";

import { AccordionItemInner, Content, FilterOperationContainer } from "./Querybuilder.styled";
import { FieldDTOWithElement } from "~/components/AdvancedSearch/domain";

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
        <Form
            ref={formRef}
            data={props.vm.data}
            onChange={props.onChange}
            onSubmit={props.onSubmit}
            invalidFields={props.vm.invalidFields}
        >
            {() => (
                <Content>
                    <Content.Panel>
                        <Details name={props.vm.name} description={props.vm.description} />
                        <Accordion elevation={1}>
                            {props.vm.data.groups.map((group, groupIndex, groups) => (
                                <AccordionItemInner key={`group-${groupIndex}`}>
                                    <AccordionItem
                                        title={group.title}
                                        open={group.open}
                                        actions={
                                            <AccordionItem.Actions>
                                                <AccordionItem.Element
                                                    element={
                                                        <FilterOperationContainer>
                                                            <OperationSelector
                                                                label={"Match all conditions"}
                                                                name={`groups.${groupIndex}.operation`}
                                                            />
                                                        </FilterOperationContainer>
                                                    }
                                                />
                                                <AccordionItem.Action
                                                    icon={<DeleteIcon />}
                                                    onClick={() => props.onDeleteGroup(groupIndex)}
                                                    disabled={!group.canDelete}
                                                />
                                            </AccordionItem.Actions>
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
                                    </AccordionItem>
                                    <GroupOperationLabel
                                        show={groups.length !== groupIndex + 1}
                                        operation={props.vm.data.operation}
                                    />
                                </AccordionItemInner>
                            ))}
                        </Accordion>
                        <AddGroup onClick={() => props.onAddGroup()} />
                    </Content.Panel>
                </Content>
            )}
        </Form>
    );
};
