import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { Switch } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import { useFileManagerPresenter } from "../../FileManagerPresenterProvider.js";

const t = i18n.ns("app-file-manager/presentation/sub-folders-toggle");

/**
 * Toggle component for including files from descendant folders in the list.
 * Sets the "includeSubFolders" filter which the FileListDataSource uses
 * to expand the folder scope via GetDescendantFoldersUseCase.
 */
export const SubFoldersToggle = observer(function SubFoldersToggle() {
    const { vm, actions } = useFileManagerPresenter();

    const checked = vm.list.filters["includeSubFolders"] === true;

    const handleChange = useCallback(
        (value: boolean) => {
            if (value) {
                actions.filter.set("includeSubFolders", true);
            } else {
                actions.filter.clear("includeSubFolders");
            }
        },
        [actions.filter]
    );

    return (
        <Switch
            label={t`Display sub-folders`}
            checked={checked}
            onChange={handleChange}
            data-testid={"fm-sub-folders-toggle"}
        />
    );
});
