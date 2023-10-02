import React, { useEffect } from "react";
import { Observer, observer } from "mobx-react-lite";
import { Form, FormAPI, FormOnSubmit } from "@webiny/form";
import { QueryObjectDTO } from "~/components/AdvancedSearch/QueryObject";
import { Filter } from "./Filter";
import { CellInner, Content, GroupContainer } from "./Querybuilder.styled";
import { Cell, Grid } from "@webiny/ui/Grid";
import { OperationSelector } from "~/components/AdvancedSearch/QueryBuilder/components/OperationSelector";
import { AddFilter, AddGroup, RemoveGroup } from "./controls";
import { QueryBuilderPresenter } from "~/components/AdvancedSearch/QueryBuilder/adapters";

export interface QueryBuilderProps {
    presenter: QueryBuilderPresenter;
    onForm: (form: FormAPI) => void;
    onSubmit: (data: any) => void;
}

export const QueryBuilder = observer(({ presenter, onForm, onSubmit }: QueryBuilderProps) => {
    const viewModel = presenter.getViewModel();
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
            {({ data }) => (
                <Observer>
                    {() => (
                        <Content>
                            <Content.Panel>
                                <button onClick={async () => await presenter.onSave(data)}>
                                    Persist
                                </button>
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
                                            <Cell span={11} align={"middle"}>
                                                <CellInner align={"left"}>
                                                    <OperationSelector
                                                        name={`groups.${groupIndex}.operation`}
                                                    />
                                                </CellInner>
                                            </Cell>
                                            <Cell span={1} align={"middle"}>
                                                <CellInner align={"center"}>
                                                    <RemoveGroup
                                                        onClick={() =>
                                                            presenter.deleteGroup(groupIndex)
                                                        }
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
                                        ))}
                                        <Grid>
                                            <Cell span={12} align={"middle"}>
                                                <CellInner align={"center"}>
                                                    <AddFilter
                                                        onClick={() =>
                                                            presenter.addNewFilterToGroup(
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
                                            <AddGroup onClick={() => presenter.addGroup()} />
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
