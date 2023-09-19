import React, { useEffect } from "react";
import { Observer, observer } from "mobx-react-lite";
import { Form, FormAPI, FormOnSubmit } from "@webiny/form";
import { QueryBuilderPresenter } from "../adapters/QueryBuilderPresenter";
import { QueryObjectDTO } from "../domain";
import { Filter } from "./Filter";
import { CellInner, Content, GroupContainer } from "./Querybuilder.styled";
import { Cell, Grid } from "@webiny/ui/Grid";
import { OperationSelector } from "~/components/AdvancedSearch/QueryBuilder/components/OperationSelector";
import { AddFilter, AddGroup, RemoveGroup } from "./controls";

export interface QueryBuilderProps {
    presenter: QueryBuilderPresenter;
    onForm: (form: FormAPI) => void;
    onSubmit: (data: any) => void;
}

export const QueryBuilder = observer(({ presenter, onForm }: QueryBuilderProps) => {
    const viewModel = presenter.getViewModel();
    const formRef = React.createRef<FormAPI>();

    useEffect(() => {
        if (formRef.current) {
            onForm(formRef.current);
        }
    }, []);

    const onChange = (data: QueryObjectDTO) => {
        console.log("data", data);
        /**
         * With this, we're updating the Query Object with actual values from the form inputs.
         */
        viewModel.setQueryObject(data);
    };

    const onFormSubmit: FormOnSubmit<QueryObjectDTO> = data => {
        viewModel.onSubmit(
            data,
            () => {
                console.log("Success!");
                console.log("data", data);

                // Call Controller, or whatever...
            },
            () => {
                console.log("Error!");
                console.log(viewModel.invalidFields);
            }
        );
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
                <Observer>
                    {() => (
                        <Content>
                            <Content.Panel>
                                <Grid>
                                    <Cell span={12} align={"middle"}>
                                        <CellInner align={"center"}>
                                            <OperationSelector name={"operation"} />
                                        </CellInner>
                                    </Cell>
                                </Grid>
                                {viewModel.queryObject.groups.map((group, groupIndex) => (
                                    <GroupContainer key={`group-${groupIndex}`}>
                                        <Grid>
                                            <Cell span={12} align={"middle"}>
                                                <CellInner align={"center"}>
                                                    <RemoveGroup
                                                        onClick={() =>
                                                            viewModel.deleteGroup(groupIndex)
                                                        }
                                                    />
                                                </CellInner>
                                            </Cell>
                                        </Grid>
                                        <Grid>
                                            <Cell span={12} align={"middle"}>
                                                <CellInner align={"center"}>
                                                    <OperationSelector
                                                        name={`groups.${groupIndex}.operation`}
                                                    />
                                                </CellInner>
                                            </Cell>
                                        </Grid>
                                        {group.filters.map((filter, filterIndex) => (
                                            <Filter
                                                key={filterIndex}
                                                name={`groups.${groupIndex}.filters.${filterIndex}`}
                                                filter={filter}
                                                fields={viewModel.fields}
                                                onEmpty={() => {
                                                    viewModel.emptyFilterIntoGroup(
                                                        groupIndex,
                                                        filterIndex
                                                    );
                                                }}
                                                onDelete={() => {
                                                    viewModel.deleteFilterFromGroup(
                                                        groupIndex,
                                                        filterIndex
                                                    );
                                                }}
                                            />
                                        ))}
                                        <Grid>
                                            <Cell span={12} align={"middle"}>
                                                <CellInner align={"center"}>
                                                    <AddFilter
                                                        onClick={() =>
                                                            viewModel.addNewFilterToGroup(
                                                                groupIndex
                                                            )
                                                        }
                                                    />
                                                </CellInner>
                                            </Cell>
                                        </Grid>
                                    </GroupContainer>
                                ))}
                                <Grid>
                                    <Cell span={12}>
                                        <CellInner align={"center"}>
                                            <AddGroup onClick={() => viewModel.addGroup()} />
                                        </CellInner>
                                    </Cell>
                                </Grid>
                            </Content.Panel>
                        </Content>
                    )}
                </Observer>
            )}
        </Form>
    );
});
