import React, { Fragment, useEffect } from "react";

import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";

import { Accordion, AccordionItem } from "@webiny/ui/Accordion";
import { Form, FormAPI, FormOnSubmit } from "@webiny/form";

import {
    AddFilter,
    AddGroup,
    Filter,
    FilterOperationLabel,
    GroupOperationLabel,
    OperationSelector
} from "./components";

import {
    AccordionItemInner,
    Content,
    FilterOperationContainer,
    GroupOperationContainer
} from "./Querybuilder.styled";

import { QueryBuilderPresenter, QueryBuilderViewModel } from "./adapters";

import { QueryObjectDTO } from "~/components/AdvancedSearch/QueryObject";

export interface QueryBuilderProps {
    onForm: (form: FormAPI) => void;
    onSubmit: (data: QueryObjectDTO) => void;
    presenter: QueryBuilderPresenter;
    viewModel: QueryBuilderViewModel;
}

export const QueryBuilder = ({ presenter, onForm, onSubmit, viewModel }: QueryBuilderProps) => {
    const formRef = React.createRef<FormAPI>();

    useEffect(() => {
        if (formRef.current) {
            onForm(formRef.current);
        }
    }, []);

    const onChange = (data: QueryObjectDTO) => {
        presenter.setQueryObject(data);
    };

    const onFormSubmit: FormOnSubmit<QueryObjectDTO> = data => {
        presenter.onSubmit(data, () => {
            onSubmit(viewModel.queryObject);
        });
    };

    return (
        <Form
            ref={formRef}
            data={viewModel.queryObject}
            onChange={onChange}
            onSubmit={onFormSubmit}
            invalidFields={viewModel.invalidFields}
        >
            {() => (
                <Content>
                    <Content.Panel>
                        <GroupOperationContainer>
                            <OperationSelector
                                name={"operation"}
                                label={"Match all filter groups"}
                            />
                        </GroupOperationContainer>
                        <Accordion>
                            {viewModel.queryObject.groups.map((group, groupIndex, groups) => (
                                <AccordionItemInner key={`group-${groupIndex}`}>
                                    <AccordionItem
                                        title={`Filter group #${groupIndex + 1}`}
                                        open={groupIndex === 0}
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
                                                    onClick={() =>
                                                        presenter.deleteGroup(groupIndex)
                                                    }
                                                />
                                            </AccordionItem.Actions>
                                        }
                                    >
                                        {group.filters.map((filter, filterIndex, filters) => (
                                            <Fragment key={filterIndex}>
                                                <Filter
                                                    name={`groups.${groupIndex}.filters.${filterIndex}`}
                                                    filter={filter}
                                                    fields={viewModel.fields}
                                                    onEmpty={() => {
                                                        presenter.emptyFilterIntoGroup(
                                                            groupIndex,
                                                            filterIndex
                                                        );
                                                    }}
                                                    onDelete={() => {
                                                        presenter.deleteFilterFromGroup(
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
                                            onClick={() =>
                                                presenter.addNewFilterToGroup(groupIndex)
                                            }
                                        />
                                    </AccordionItem>
                                    <GroupOperationLabel
                                        show={groups.length !== groupIndex + 1}
                                        operation={viewModel.queryObject.operation}
                                    />
                                </AccordionItemInner>
                            ))}
                        </Accordion>
                        <AddGroup onClick={() => presenter.addGroup()} />
                    </Content.Panel>
                </Content>
            )}
        </Form>
    );
};
