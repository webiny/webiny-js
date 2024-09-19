import { useState } from "react";
import { useRouter, UseHistory, UseLocation } from "@webiny/react-router";

export type UseMultiSelectParams = {
    useRouter?: boolean;
    getValue?: (item: Record<string, any>) => string;
};

export type MultiListProps = {
    isSelected: (item: any) => boolean;
    select: (item: any) => void;
    isMultiSelected: (item: any) => boolean;
    isNoneMultiSelected: (data: any[] | null) => boolean;
    isAllMultiSelected: (data: any[] | null) => boolean;
    multiSelectAll: (value: boolean, data: any[] | null) => void;
    getMultiSelected: () => any[];
    multiSelect: (items: Record<string, any> | Record<string, any>[], value?: boolean) => void;
};

const useMultiSelect = (params: UseMultiSelectParams) => {
    const [multiSelectedItems, multiSelect] = useState<string[]>([]);
    let history: UseHistory | undefined = undefined;
    let location: UseLocation | undefined = undefined;
    const routerHook = useRouter();
    const {
        getValue = (): string => {
            return "";
        }
    } = params;

    if (params.useRouter !== false) {
        history = routerHook.history;
        location = routerHook.location;
    }

    const multiListProps: MultiListProps = {
        multiSelect(initialItems, value): void {
            const items = Array.isArray(initialItems)
                ? (initialItems as Record<string, any>[])
                : [initialItems as Record<string, any>];

            const returnItems = [...multiSelectedItems];

            items.forEach(item => {
                const id = getValue(item);
                if (value === undefined) {
                    returnItems.includes(id)
                        ? returnItems.splice(returnItems.indexOf(id), 1)
                        : returnItems.push(id);
                } else {
                    if (value === true) {
                        !returnItems.includes(id) && returnItems.push(id);
                    } else {
                        returnItems.includes(id) &&
                            returnItems.splice(returnItems.indexOf(getValue(item)), 1);
                    }
                }
            });

            multiSelect(returnItems);
        },
        isSelected(item) {
            const query = new URLSearchParams(location ? location.search : "");
            return query.get("id") === item.id;
        },
        select(item) {
            const query = new URLSearchParams(location ? location.search : "");
            query.set("id", item.id);
            if (!history) {
                return;
            }
            history.push({ search: query.toString() });
        },
        isMultiSelected(item) {
            if (!Array.isArray(multiSelectedItems)) {
                return false;
            }

            return multiSelectedItems.includes(getValue(item));
        },
        isNoneMultiSelected() {
            return multiSelectedItems.length === 0;
        },
        getMultiSelected() {
            return multiSelectedItems;
        },
        multiSelectAll(value: boolean, data): void {
            if (Array.isArray(data)) {
                multiListProps.multiSelect(data, value);
            } else {
                multiListProps.multiSelect([], value);
            }
        },
        isAllMultiSelected(data): boolean {
            return (
                Array.isArray(data) && data.length > 0 && multiSelectedItems.length === data.length
            );
        }
    };

    return multiListProps;
};

export { useMultiSelect };
