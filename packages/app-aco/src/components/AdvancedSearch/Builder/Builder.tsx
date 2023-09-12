import React, { useEffect } from "react";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/round/add_circle_outline.svg";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/round/delete.svg";
import { Bind, Form, FormAPI } from "@webiny/form";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";
import { observer } from "mobx-react-lite";
import { Filter as FilterComponent } from "./Filter";
import { CellInner, Content, GroupContainer } from "./styled";
import { Field } from "../types";
import { SearchConfigurationDTO } from "./SearchConfiguration";
import { Radio, RadioGroup } from "@webiny/ui/Radio";
import { BuilderPresenter } from "./BuilderPresenter";
import { BuilderController } from "./BuilderController";

export interface BuilderProps {
    presenter: BuilderPresenter;
    controller: BuilderController;
    onChange: (data: any) => void;
    fields: Field[];
    onForm: (form: FormAPI) => void;
}

export const Builder: React.VFC<BuilderProps> = observer(
    ({ presenter, controller, fields, onForm }) => {
        const { configuration, operations } = presenter.viewModel;
        const formRef = React.createRef<FormAPI>();

        useEffect(() => {
            if (formRef.current) {
                onForm(formRef.current);
            }
        }, []);

        const onChange = (data: SearchConfigurationDTO) => {
            console.log("Form data", data);
            controller.updateConfiguration(data);
        };

        const onFormSubmit = () => {
            console.log("output", configuration);
            // onSubmit(output);
        };

        return (
            <Form<SearchConfigurationDTO>
                ref={formRef}
                data={configuration}
                onChange={data => onChange(data)}
                onSubmit={onFormSubmit}
            >
                {({ data }) => (
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
                                                                onChange={onChange(option)}
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
                                                <Bind name={`groups.${groupIndex}.operation`}>
                                                    <RadioGroup label={"Operation"}>
                                                        {({ onChange, getValue }) => (
                                                            <>
                                                                {operations.map(option => (
                                                                    <Radio
                                                                        key={option}
                                                                        label={option}
                                                                        value={getValue(option)}
                                                                        onChange={onChange(option)}
                                                                    />
                                                                ))}
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
                                                        console.log("Delete group", group);
                                                        controller.deleteGroup(groupIndex);
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
                                                controller.deleteFilter(groupIndex, filterIndex);
                                            }}
                                        />
                                    ))}
                                    <Grid>
                                        <Cell span={12}>
                                            <CellInner align={"center"}>
                                                <Tooltip content={"Add field"} placement={"bottom"}>
                                                    <IconButton
                                                        label={"Add field"}
                                                        icon={<AddIcon />}
                                                        onClick={() => {
                                                            console.log("Add filter");
                                                            controller.addFilter(groupIndex);
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
                                        <Tooltip content={"Add group"} placement={"bottom"}>
                                            <IconButton
                                                label={"Add group"}
                                                icon={<AddIcon />}
                                                onClick={() => {
                                                    console.log("Add group");
                                                    controller.addGroup();
                                                }}
                                            />
                                        </Tooltip>
                                    </CellInner>
                                </Cell>
                            </Grid>
                        </Content.Panel>
                    </Content>
                )}
            </Form>
        );
    }
);
