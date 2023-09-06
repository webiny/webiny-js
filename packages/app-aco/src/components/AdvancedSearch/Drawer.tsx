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

interface DrawerProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    fields: Field[];
}

interface FormProps {
    filters: IFilter[];
}

export const Drawer: React.VFC<DrawerProps> = ({ open, onClose, fields, onSubmit }) => {
    const { current: advancedSearchPresenter } = useRef(new AdvancedSearchPresenter());
    const filters = advancedSearchPresenter.listFilters();

    useEffect(() => {
        advancedSearchPresenter.createFilter();

        return () => {
            advancedSearchPresenter.deleteAllFilters();
        };
    }, []);

    const onChange = (filters: IFilter[]) => {
        if (!filters || !filters.length) {
            return;
        }

        for (const filter of filters) {
            advancedSearchPresenter.updateFilter(filter);
        }
    };

    useHotkeys({
        zIndex: 55,
        disabled: !open,
        keys: {
            esc: onClose
        }
    });

    const onFormSubmit = () => {
        const filters = advancedSearchPresenter.listFilters();
        console.log("filters", JSON.stringify(filters));

        const filtersOutput = advancedSearchPresenter.getFiltersOutput();
        console.log("filtersOutput", JSON.stringify(filtersOutput));

        onSubmit(filtersOutput);
    };

    return (
        <DrawerContainer modal open={open} onClose={onClose} dir="rtl">
            <DrawerContent dir="ltr">
                <Form<FormProps>
                    data={{ filters }}
                    onChange={data => onChange(data.filters)}
                    onSubmit={onFormSubmit}
                >
                    {({ data }) => (
                        <DrawerContent dir="ltr">
                            <div className={"container"}>
                                <Header onClose={onClose} />
                                <Content>
                                    <Content.Panel>
                                        {data.filters.map((filter, index) => (
                                            <Filter
                                                key={filter.id}
                                                index={index}
                                                filter={filter}
                                                fields={fields}
                                                onRemove={() => {
                                                    advancedSearchPresenter.deleteFilter(filter.id);
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
                                                                advancedSearchPresenter.createFilter();
                                                            }}
                                                        />
                                                    </Tooltip>
                                                </CellInner>
                                            </Cell>
                                        </Grid>
                                    </Content.Panel>
                                </Content>
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
