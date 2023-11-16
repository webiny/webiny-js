import React, { useCallback } from "react";
import { List } from "react-virtualized";

import { Tab } from "@webiny/ui/Tabs";
import { Typography } from "@webiny/ui/Typography";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";
import { Input } from "@webiny/ui/Input";

import { IconRenderer } from "./IconRenderer";
import { IconPickerTabProps } from "./types";
import {
    Row,
    Cell,
    CategoryLabel,
    TabContentWrapper,
    ListWrapper,
    NoResultsWrapper,
    InputsWrapper
} from "./IconPicker.styles";

type RenderRowProps = {
    index: number;
    key: string;
    style: Record<string, any>;
};

export const IconPickerTab = ({
    label,
    rows,
    value,
    onChange,
    filter,
    onFilterChange,
    color,
    children
}: IconPickerTabProps) => {
    const renderRow = useCallback(
        ({ index, key, style }: RenderRowProps) => {
            const currentRow = rows[index];

            if (currentRow.type === "category-name") {
                return (
                    <Row key={key} style={style}>
                        <CategoryLabel>{currentRow.name}</CategoryLabel>
                    </Row>
                );
            }

            return (
                <Row key={key} style={style}>
                    {currentRow.icons.map((item, itemKey) => (
                        <Cell
                            key={itemKey}
                            color={color}
                            isActive={item.name === value?.name}
                            onClick={() => {
                                onChange({
                                    type: item.type,
                                    name: item.name,
                                    value: item.value,
                                    width: item.width
                                });
                            }}
                        >
                            <IconRenderer icon={item} size={32} />
                        </Cell>
                    ))}
                </Row>
            );
        },
        [rows, color, value]
    );

    return (
        <Tab label={label}>
            <TabContentWrapper>
                <InputsWrapper>
                    <DelayedOnChange value={filter} onChange={onFilterChange}>
                        {({ value, onChange }) => (
                            <Input
                                value={value}
                                onChange={onChange}
                                placeholder={"Search icons..."}
                            />
                        )}
                    </DelayedOnChange>
                    {children}
                </InputsWrapper>
                <ListWrapper>
                    {rows.length === 0 ? (
                        <NoResultsWrapper>
                            <Typography use="body1">No results found.</Typography>
                        </NoResultsWrapper>
                    ) : (
                        <List
                            rowRenderer={renderRow}
                            height={400}
                            rowCount={rows.length}
                            rowHeight={40}
                            width={340}
                        />
                    )}
                </ListWrapper>
            </TabContentWrapper>
        </Tab>
    );
};
