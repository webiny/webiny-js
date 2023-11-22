import React, { Fragment } from "react";
import { List } from "react-virtualized";

import { Tab } from "@webiny/ui/Tabs";
import { Typography } from "@webiny/ui/Typography";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";
import { Input } from "@webiny/ui/Input";

import { IconProvider, IconRenderer } from "./IconRenderer";
import {
    Row,
    Cell,
    CategoryLabel,
    TabContentWrapper,
    ListWrapper,
    NoResultsWrapper,
    InputsWrapper
} from "./IconPicker.styles";
import { useIconPicker } from "~/components/IconPicker/IconPickerPresenterProvider";
import { makeComposable } from "@webiny/react-composition";
import { useIconType } from "~/components/IconPicker/config/IconType";
import { Icon, IconPickerGridRow } from "./types";

type RenderRowProps = {
    onIconClick: (icon: Icon) => void;
    style: Record<string, any>;
    row: IconPickerGridRow;
    cellDecorator: CellDecorator;
};

export const IconPickerTabRenderer = makeComposable("IconPickerTabRenderer");

const useIconTypeRows = (type: string) => {
    const presenter = useIconPicker();
    const group = presenter.vm.data.find(group => group.type === type);
    const rows = group ? group.rows : [];

    return {
        isEmpty: rows.length === 0,
        rows,
        rowCount: rows.length
    };
};

const RowRenderer = ({ row, style, cellDecorator, onIconClick }: RenderRowProps) => {
    const presenter = useIconPicker();
    const value = presenter.vm.selectedIcon;

    if (row.type === "category-name") {
        return (
            <Row style={style}>
                <CategoryLabel>{row.name}</CategoryLabel>
            </Row>
        );
    }

    return (
        <Row style={style}>
            {row.icons.map((item, itemKey) => (
                <Fragment key={itemKey}>
                    {cellDecorator(
                        <Cell
                            key={itemKey}
                            isActive={item.name === value?.name}
                            onClick={() => onIconClick(item)}
                        >
                            <IconProvider icon={item}>
                                <IconRenderer />
                            </IconProvider>
                        </Cell>
                    )}
                </Fragment>
            ))}
        </Row>
    );
};

interface CellDecorator {
    (cell: React.ReactElement): React.ReactElement;
}

const noopDecorator: CellDecorator = cell => cell;

export interface IconPickerTabProps {
    label: string;
    onChange: (icon: Icon) => void;
    actions?: React.ReactElement;
    cellDecorator?: CellDecorator;
}

export const IconPickerTab = ({
    label,
    actions,
    onChange,
    cellDecorator = noopDecorator
}: IconPickerTabProps) => {
    const { type } = useIconType();
    const { isEmpty, rowCount, rows } = useIconTypeRows(type);
    const presenter = useIconPicker();

    return (
        <Tab label={label}>
            <TabContentWrapper>
                <InputsWrapper>
                    <DelayedOnChange
                        value={presenter.vm.filter}
                        onChange={value => presenter.setFilter(value)}
                    >
                        {({ value, onChange }) => (
                            <Input
                                value={value}
                                onChange={onChange}
                                placeholder={"Search icons..."}
                            />
                        )}
                    </DelayedOnChange>
                    {actions ? actions : null}
                </InputsWrapper>
                <ListWrapper>
                    {isEmpty ? (
                        <NoResultsWrapper>
                            <Typography use="body1">No results found.</Typography>
                        </NoResultsWrapper>
                    ) : (
                        <List
                            rowRenderer={({ key, ...props }) => (
                                <RowRenderer
                                    key={key}
                                    row={rows[props.index]}
                                    cellDecorator={cellDecorator}
                                    onIconClick={onChange}
                                    {...props}
                                />
                            )}
                            height={400}
                            rowCount={rowCount}
                            rowHeight={40}
                            width={340}
                        />
                    )}
                </ListWrapper>
            </TabContentWrapper>
        </Tab>
    );
};
