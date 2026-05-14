import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { Select } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import { useFileManagerPresenter } from "../../FileManagerPresenterProvider.js";

const t = i18n.ns("app-file-manager/presentation/type-filter");

const TYPE_OPTIONS = [
    { label: t`All`, value: "" },
    { label: t`Images`, value: "image/" },
    { label: t`Videos`, value: "video/" },
    { label: t`Documents`, value: "application/" }
];

/**
 * File type filter component wired to the FileListPresenter.
 * Sets the "type" filter via presenter.actions.filter.set/clear.
 */
export const TypeFilter = observer(function TypeFilter() {
    const { vm, actions } = useFileManagerPresenter();

    // Read the current type filter value.
    const currentValue = (vm.list.filters["type"] as string) ?? "";

    const handleChange = useCallback(
        (value: string) => {
            if (value) {
                actions.filter.set("type", value);
            } else {
                actions.filter.clear("type");
            }
        },
        [actions.filter]
    );

    return (
        <Select
            value={currentValue}
            onChange={handleChange}
            options={TYPE_OPTIONS}
            placeholder={t`Filter by type`}
            size={"md"}
            data-testid={"fm-type-filter"}
            displayResetAction={false}
        />
    );
});
