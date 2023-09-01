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

import { Content } from "./Content";
import { FilterManager } from "./FilterManager";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Filter } from "./Filter";

import { DrawerContainer } from "./styled";

import { Field, TFilter } from "./types";

interface DrawerProps {
    open: boolean;
    onClose: () => void;
    fields: Field[];
}

interface FormProps {
    filters: TFilter[];
}

export const Drawer: React.VFC<DrawerProps> = ({ open, onClose, fields }) => {
    const { current: filterManager } = useRef(new FilterManager());
    const filters = filterManager.listFilters();

    useEffect(() => {
        filterManager.createFilter();

        return () => {
            filterManager.deleteAllFilters();
        };
    }, []);

    const onChange = (filters: TFilter[]) => {
        if (!filters || !filters.length) {
            return;
        }

        for (const filter of filters) {
            filterManager.updateFilter(filter);
        }
    };

    useHotkeys({
        zIndex: 55,
        disabled: !open,
        keys: {
            esc: onClose
        }
    });

    const onSubmit = () => {
        const filters = filterManager.listFilters();
        console.log("filters", JSON.stringify(filters));

        const filtersOutput = filterManager.getFiltersOutput();
        console.log("filtersOutput", JSON.stringify(filtersOutput));
    };

    return (
        <DrawerContainer modal open={open} onClose={onClose} dir="rtl">
            <DrawerContent dir="ltr">
                <Form<FormProps> onChange={data => onChange(data.filters)} onSubmit={onSubmit}>
                    {({ data }) => (
                        <DrawerContent dir="ltr">
                            <div className={"container"}>
                                <Header onClose={onClose} />
                                <Content>
                                    <Content.Panel>
                                        {filters.map((filter, index) => (
                                            <Filter
                                                key={filter.id}
                                                index={index}
                                                filter={filter}
                                                fields={fields}
                                                onRemove={() => {
                                                    data.filters.splice(index, 1);
                                                    filterManager.deleteFilter(filter.id);
                                                }}
                                            />
                                        ))}
                                        <Grid>
                                            <Cell span={12}>
                                                <Tooltip
                                                    content={"Add filter"}
                                                    placement={"bottom"}
                                                >
                                                    <IconButton
                                                        icon={<AddIcon />}
                                                        onClick={() => {
                                                            filterManager.createFilter();
                                                        }}
                                                        label={"Add field"}
                                                    />
                                                </Tooltip>
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
