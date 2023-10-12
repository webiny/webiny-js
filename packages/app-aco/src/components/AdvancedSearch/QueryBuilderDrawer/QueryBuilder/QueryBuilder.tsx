import React, { Fragment, useEffect } from "react";

import { observer } from "mobx-react-lite";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";

import { Accordion, AccordionItem } from "@webiny/ui/Accordion";
import { Form, FormAPI, FormOnSubmit } from "@webiny/form";

import { QueryObjectDTO } from "~/components/AdvancedSearch/QueryObject";

import { QueryBuilderDrawerPresenter, QueryBuilderFormData } from "../QueryBuilderDrawerPresenter";

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

export interface QueryBuilderProps {
    onForm: (form: FormAPI) => void;
    onSubmit: (data: QueryObjectDTO) => void;
    presenter: QueryBuilderDrawerPresenter;
}

export const QueryBuilder = observer(({ presenter, onForm, onSubmit }: QueryBuilderProps) => {
    const formRef = React.createRef<FormAPI>();

    useEffect(() => {
        if (formRef.current) {
            onForm(formRef.current);
        }
    }, []);

    const onChange = (data: QueryBuilderFormData) => {
        presenter.setQueryObject(data);
    };

    const onFormSubmit: FormOnSubmit<QueryBuilderFormData> = () => {
        presenter.onSubmit(queryObject => {
            onSubmit(queryObject);
        });
    };

    return (
        <Form
            ref={formRef}
            data={presenter.vm.data}
            onChange={onChange}
            onSubmit={onFormSubmit}
            invalidFields={presenter.vm.invalidFields}
        >
            {() => (
                <Content>
                    <Content.Panel>
                        <Details name={presenter.vm.name} description={presenter.vm.description} />
                        <Accordion elevation={1}>
                            {presenter.vm.data.groups.map((group, groupIndex, groups) => (
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
                                                    fields={presenter.vm.fields}
                                                    onFieldSelectChange={data =>
                                                        presenter.setFilterFieldData(
                                                            groupIndex,
                                                            filterIndex,
                                                            data
                                                        )
                                                    }
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
                                        operation={presenter.vm.data.operation}
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
});
