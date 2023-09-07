import React, { useEffect, useRef } from "react";

import { ReactComponent as AddIcon } from "@material-design-icons/svg/round/add_circle_outline.svg";
import { Form } from "@webiny/form";
import { DrawerContent } from "@webiny/ui/Drawer";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";
import { observer } from "mobx-react-lite";
// @ts-ignore
import { useHotkeys } from "react-hotkeyz";

import { AdvancedSearchPresenter } from "./AdvancedSearchPresenter";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Filter } from "./Filter";

import { CellInner, Content, DrawerContainer } from "./styled";

import { Field, IFilter } from "./types";
import { SearchConfigurationPresenter } from "~/components/AdvancedSearch/SearchConfigurationPresenter";
import { SearchConfiguration } from "~/components/AdvancedSearch/SearchConfiguration";

interface DrawerProps {
    presenter: SearchConfigurationPresenter;
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    fields: Field[];
}

interface FormProps {
    filters: IFilter[];
}

const Drawer: React.VFC<DrawerProps> = ({ presenter, open, onClose, fields, onSubmit }) => {
    const { addGroup, groups } = presenter.viewModel;
    console.log("configuration", groups);

    const onChange = (data: SearchConfiguration) => {
        console.log("SearchConfiguration", data);

        // for (const filter of filters) {
        //     advancedSearchPresenter.updateFilter(filter);
        // }
    };

    useHotkeys({
        zIndex: 55,
        disabled: !open,
        keys: {
            esc: onClose
        }
    });

    const onFormSubmit = () => {
        // const filters = advancedSearchPresenter.listFilters();
        // console.log("filters", JSON.stringify(filters));
        //
        // const filtersOutput = advancedSearchPresenter.getFiltersOutput();
        // console.log("filtersOutput", JSON.stringify(filtersOutput));
        //
        // onSubmit(filtersOutput);
    };

    return (
        <DrawerContainer modal open={open} onClose={onClose} dir="rtl">
            <DrawerContent dir="ltr">
                <Form<SearchConfiguration>
                    onChange={data => onChange(data)}
                    onSubmit={onFormSubmit}
                >
                    {({ data }) => (
                        <DrawerContent dir="ltr">
                            <div className={"container"}>
                                <Header onClose={onClose} />
                                {groups.map((group, index) => (
                                    <div key={`group-${index}`}>
                                        {"Group"}
                                        {group.filters.map((filter, index) => (
                                            <Content key={filter.id}>
                                                <Content.Panel>
                                                    <Filter
                                                        index={index}
                                                        filter={filter}
                                                        fields={fields}
                                                        onRemove={() => {
                                                            console.log("Remove", filter);
                                                        }}
                                                    />

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
                                                                            group.addFilter();
                                                                        }}
                                                                    />{" "}
                                                                    Add Filter
                                                                </Tooltip>
                                                            </CellInner>
                                                        </Cell>
                                                    </Grid>
                                                </Content.Panel>
                                            </Content>
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
                                                                addGroup();
                                                            }}
                                                        />{" "}
                                                        Add Group
                                                    </Tooltip>
                                                </CellInner>
                                            </Cell>
                                        </Grid>
                                    </div>
                                ))}

                                <Footer onClose={onClose} />
                            </div>
                        </DrawerContent>
                    )}
                </Form>
            </DrawerContent>
        </DrawerContainer>
    );
};

export default observer(Drawer);
