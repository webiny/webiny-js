// @ts-nocheck
import React from "react";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/round/add_circle_outline.svg";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/round/delete.svg";
import { Bind, Form } from "@webiny/form";
import { DrawerContent } from "@webiny/ui/Drawer";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";
import { observer } from "mobx-react-lite";
// @ts-ignore
import { useHotkeys } from "react-hotkeyz";

import { Footer } from "./Footer";
import { Header } from "./Header";
import { Filter as FilterComponent } from "./Filter";

import { CellInner, Content, DrawerContainer, GroupContainer } from "./styled";

import { Field, FilterOperation } from "./types";

import { Group, Filter, SearchConfiguration } from "./SearchConfiguration";
import { SearchConfigurationController } from "./SearchConfigurationController";
import { SearchConfigurationPresenter } from "./SearchConfigurationPresenter";
import { Radio, RadioGroup } from "@webiny/ui/Radio";

interface DrawerProps {
    presenter: SearchConfigurationPresenter;
    controller: SearchConfigurationController;
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    fields: Field[];
}

interface FormProps {
    operation: FilterOperation;
    groups: Group[];
}

export const Drawer: React.VFC<DrawerProps> = observer(
    ({ presenter, controller, open, onClose, fields, onSubmit }) => {
        const { configuration, operations, toObject } = presenter.viewModel;

        const onChange = (data: SearchConfiguration) => {
            console.log("SearchConfiguration", data);
            controller.updateConfiguration(data);
        };

        useHotkeys({
            zIndex: 55,
            disabled: !open,
            keys: {
                esc: onClose
            }
        });

        const onFormSubmit = () => {
            const output = toObject();
            console.log("output", output);
            // onSubmit(output);
        };

        const addGroup = () => {
            controller.updateConfiguration({
                ...configuration,
                groups: [
                    ...configuration.groups,
                    {
                        operation: FilterOperation.AND,
                        filters: [{ field: "", value: "", condition: "" }]
                    }
                ]
            });
        };

        const addFilter = (group: Group) => {
            const index = configuration.groups.findIndex(g => g.id === group.id);
            if (index <= -1) {
                return;
            }

            configuration.groups[index].filters.push({ field: "", value: "", condition: "" });

            controller.updateConfiguration(configuration);
        };

        const deleteGroup = (groupToDelete: Group) => {
            controller.updateConfiguration({
                ...configuration,
                groups: configuration.groups.filter(group => groupToDelete.id !== group.id)
            });
        };

        const deleteFilter = (group: Group, filter: Filter) => {
            const groupIndex = configuration.groups.findIndex(g => g.id === group.id);
            const newFilters = configuration.groups[groupIndex].filters.filter(f => f.id !== filter.id);
            configuration.groups[groupIndex].filters = newFilters;

            controller.updateConfiguration(configuration);
        };

        return (
            <DrawerContainer modal open={open} onClose={onClose} dir="rtl">
                <DrawerContent dir="ltr">
                    <Form<FormProps>
                        data={configuration}
                        onChange={data => onChange(data)}
                        onSubmit={onFormSubmit}
                    >
                        {({ data }) => (
                            <DrawerContent dir="ltr">
                                <Header onClose={onClose} />
                                <Content>
                                    <Content.Panel>
                                        <Grid>
                                            <Cell span={12} align={"middle"}>
                                                <CellInner align={"center"}>
                                                    <Bind name={`operation`}>
                                                        <RadioGroup label={"Operation"}>
                                                            {({ onChange, getValue }) => (
                                                                <>
                                                                    {operations.map(option => (
                                                                        <Radio
                                                                            key={option}
                                                                            label={option}
                                                                            value={getValue(option)}
                                                                            onChange={onChange(
                                                                                option
                                                                            )}
                                                                        />
                                                                    ))}
                                                                </>
                                                            )}
                                                        </RadioGroup>
                                                    </Bind>
                                                </CellInner>
                                            </Cell>
                                        </Grid>
                                        {data.groups.map((group, groupIndex) => (
                                            <GroupContainer key={`group-${groupIndex}`}>
                                                <Grid>
                                                    <Cell span={11} align={"middle"}>
                                                        <CellInner align={"left"}>
                                                            <Bind
                                                                name={`groups.${groupIndex}.operation`}
                                                            >
                                                                <RadioGroup label={"Operation"}>
                                                                    {({ onChange, getValue }) => (
                                                                        <>
                                                                            {operations.map(
                                                                                option => (
                                                                                    <Radio
                                                                                        key={option}
                                                                                        label={
                                                                                            option
                                                                                        }
                                                                                        value={getValue(
                                                                                            option
                                                                                        )}
                                                                                        onChange={onChange(
                                                                                            option
                                                                                        )}
                                                                                    />
                                                                                )
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </RadioGroup>
                                                            </Bind>
                                                        </CellInner>
                                                    </Cell>
                                                    <Cell span={1} align={"middle"}>
                                                        <CellInner align={"center"}>
                                                            <IconButton
                                                                label={"Delete group"}
                                                                icon={<DeleteIcon />}
                                                                onClick={() => {
                                                                    console.log(
                                                                        "Delete group",
                                                                        group
                                                                    );
                                                                    deleteGroup(group);
                                                                }}
                                                            />
                                                        </CellInner>
                                                    </Cell>
                                                </Grid>

                                                {group.filters.map((filter, filterIndex) => (
                                                    <FilterComponent
                                                        key={filterIndex}
                                                        groupIndex={groupIndex}
                                                        filterIndex={filterIndex}
                                                        filter={filter}
                                                        fields={fields}
                                                        onRemove={() => {
                                                            console.log("Delete filter", filter);
                                                            deleteFilter(group, filter);
                                                        }}
                                                    />
                                                ))}
                                                <Grid>
                                                    <Cell span={12}>
                                                        <CellInner align={"center"}>
                                                            <Tooltip
                                                                content={"Add field"}
                                                                placement={"bottom"}
                                                            >
                                                                <IconButton
                                                                    label={"Add field"}
                                                                    icon={<AddIcon />}
                                                                    onClick={() => {
                                                                        console.log("Add filter");
                                                                        addFilter(group);
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        </CellInner>
                                                    </Cell>
                                                </Grid>
                                            </GroupContainer>
                                        ))}

                                        <Grid>
                                            <Cell span={12}>
                                                <CellInner align={"center"}>
                                                    <Tooltip
                                                        content={"Add group"}
                                                        placement={"bottom"}
                                                    >
                                                        <IconButton
                                                            label={"Add group"}
                                                            icon={<AddIcon />}
                                                            onClick={() => {
                                                                console.log("Add group");
                                                                addGroup();
                                                            }}
                                                        />
                                                    </Tooltip>
                                                </CellInner>
                                            </Cell>
                                        </Grid>
                                    </Content.Panel>
                                </Content>
                                <Footer onClose={onClose} />
                            </DrawerContent>
                        )}
                    </Form>
                </DrawerContent>
            </DrawerContainer>
        );
    }
);
