import React, { ReactElement, useCallback, useState } from "react";

import { useMutation } from "@apollo/react-hooks";
import { ReactComponent as Edit } from "@material-design-icons/svg/filled/edit.svg";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";

import { CREATE_PAGE } from "~/admin/graphql/pages";
import * as GQLCache from "~/admin/views/Pages/cache";
import usePermission from "~/hooks/usePermission";

import { ListItemGraphic } from "~/admin/components/Table/Table/styled";
import { PbPageDataItem } from "~/types";

const t = i18n.ns("app-headless-cms/app-page-builder/pages-table/actions/page/edit");

interface Props {
    record: PbPageDataItem;
}
export const RecordActionEdit = ({ record }: Props): ReactElement => {
    const { canEdit } = usePermission();
    const { history } = useRouter();
    const [inProgress, setInProgress] = useState<boolean>();
    const { showSnackbar } = useSnackbar();
    const [createPageFrom] = useMutation(CREATE_PAGE);

    const createFromAndEdit = useCallback(async () => {
        setInProgress(true);
        const response = await createPageFrom({
            variables: { from: record.id },
            update(cache, { data }) {
                if (data.pageBuilder.createPage.error) {
                    return;
                }

                GQLCache.updateLatestRevisionInListCache(cache, data.pageBuilder.createPage.data);
            }
        });
        setInProgress(false);
        const { data, error } = response.data.pageBuilder.createPage;
        if (error) {
            return showSnackbar(error.message);
        }
        history.push(`/page-builder/editor/${encodeURIComponent(data.id)}`);
    }, [record]);

    if (!canEdit(record)) {
        return <></>;
    }

    if (record.locked) {
        return <MenuItem disabled={inProgress} onClick={createFromAndEdit}>{t`Edit`}</MenuItem>;
    }
    return (
        <MenuItem
            disabled={inProgress}
            onClick={() => {
                history.push(`/page-builder/editor/${encodeURIComponent(record.id)}`);
            }}
        >
            <ListItemGraphic>
                <Icon icon={<Edit />} />
            </ListItemGraphic>
            {t`Edit`}
        </MenuItem>
    );
};
