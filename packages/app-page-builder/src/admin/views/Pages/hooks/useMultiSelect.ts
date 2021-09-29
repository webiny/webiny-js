import { useState } from "react";
import { useRouter } from "@webiny/react-router";

export type UseMultiSelectParams = {
    useRouter?: boolean;
};

export type MultiListProps = {
    isSelected: (item: any) => boolean;
    select: (item: any) => void;
    isMultiSelected: (item: any) => boolean;
    isNoneMultiSelected: (data: any[]) => boolean;
    isAllMultiSelected: (data: any[]) => boolean;
    multiSelectAll: (value: boolean, data: any[]) => void;
    getMultiSelected: () => any[];
    multiSelect: (items: string | string[], value?: boolean) => void;
};

const useMultiSelect = (params: UseMultiSelectParams) => {
    const [multiSelectedItems, multiSelect] = useState([]);
    let history = null;
    let location = null;
    const routerHook = useRouter();

    if (params.useRouter !== false) {
        history = routerHook.history;
        location = routerHook.location;
    }

    const multiListProps: MultiListProps = {
        multiSelect(items, value): void {
            if (!Array.isArray(items)) {
                items = [items];
            }

            const returnItems = [...multiSelectedItems];

            items.forEach(item => {
                if (value === undefined) {
                    returnItems.includes(item)
                        ? returnItems.splice(returnItems.indexOf(item), 1)
                        : returnItems.push(item);
                } else {
                    if (value === true) {
                        !returnItems.includes(item) && returnItems.push(item);
                    } else {
                        returnItems.includes(item) &&
                            returnItems.splice(returnItems.indexOf(item), 1);
                    }
                }
            });

            multiSelect(returnItems);
        },
        isSelected(item) {
            const query = new URLSearchParams(location.search);
            return query.get("id") === item.id;
        },
        select(item) {
            const query = new URLSearchParams(location.search);
            query.set("id", item.id);
            history.push({ search: query.toString() });
        },
        isMultiSelected(item) {
            if (!Array.isArray(multiSelectedItems)) {
                return false;
            }

            return multiSelectedItems.includes(item);
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
