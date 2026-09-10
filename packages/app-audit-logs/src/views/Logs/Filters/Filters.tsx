import React, { useCallback, useState } from "react";
import { ReactComponent as FilterIcon } from "@webiny/icons/filter_list.svg";
import { Drawer, IconButton } from "@webiny/admin-ui";
import { Form } from "@webiny/form";
import { useAuditLogsListConfig } from "~/config/list/index.js";
import type { IListAuditLogsVariablesWhere } from "~/hooks/graphql.js";

interface FiltersProps {
    setWhere: (where: Partial<IListAuditLogsVariablesWhere>) => void;
}

export const Filters = ({ setWhere }: FiltersProps) => {
    const { browser } = useAuditLogsListConfig();
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState<Record<string, unknown>>({});
    const [hasActiveFilters, setHasActiveFilters] = useState(false);

    const onFormChange = useCallback((data: Record<string, unknown>) => {
        setFormData(data);
    }, []);

    const applyFilters = useCallback(() => {
        const hasValues = Object.values(formData).some(v => v !== undefined && v !== "");
        setHasActiveFilters(hasValues);

        if (!hasValues) {
            setWhere({});
            setOpen(false);
            return;
        }

        const convertedFilters = browser.filtersToWhere.reduce(
            (acc, converter) => converter(acc),
            formData
        );

        setWhere(convertedFilters as Partial<IListAuditLogsVariablesWhere>);
        setOpen(false);
    }, [browser.filtersToWhere, setWhere, formData]);

    const clearFilters = useCallback(() => {
        setFormData({});
        setWhere({});
        setHasActiveFilters(false);
    }, [setWhere]);

    return (
        <>
            <IconButton
                variant={hasActiveFilters ? "primary" : "ghost"}
                icon={<FilterIcon />}
                onClick={() => setOpen(true)}
                data-testid="audit-logs.toggle-filters"
            />
            <Drawer
                open={open}
                onClose={() => setOpen(false)}
                modal={true}
                width={360}
                title="Filters"
                headerSeparator={true}
                footerSeparator={true}
                bodyPadding={false}
                actions={
                    <>
                        <Drawer.CancelButton text="Clear all" onClick={clearFilters} />
                        <Drawer.ConfirmButton text="Apply filters" onClick={applyFilters} />
                    </>
                }
            >
                <Form data={formData} onChange={onFormChange}>
                    {() => (
                        <div className={"flex flex-col gap-lg p-lg"}>
                            {browser.filters.map(filter => (
                                <div key={filter.name}>{filter.element}</div>
                            ))}
                        </div>
                    )}
                </Form>
            </Drawer>
        </>
    );
};
