import React, { useCallback, useMemo } from "react";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "react-apollo";
import { DELETE_PAGE, LIST_PAGES } from "@webiny/app-page-builder/admin/graphql/pages";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { useSecurity } from "@webiny/app-security";
import TimeAgo from "timeago-react";
import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemMeta,
    ListTextOverline,
    ListItemTextSecondary
} from "@webiny/ui/List";
import { Typography } from "@webiny/ui/Typography";
import { css } from "emotion";

const t = i18n.ns("app-page-builder/admin/pages/data-list");
const rightAlign = css({
    alignItems: "flex-end !important"
});

const PageBuilderPagesDataList = () => {
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const listQuery = useQuery(LIST_PAGES);
    const [deleteIt, deleteMutation] = useMutation(DELETE_PAGE, {
        refetchQueries: [{ query: LIST_PAGES }]
    });

    const { showConfirmation } = useConfirmationDialog();

    const data = listQuery?.data?.pageBuilder?.listPages?.data || [];
    const slug = new URLSearchParams(location.search).get("slug");

    // TODO remove
    // eslint-disable-next-line
    const deleteItem = useCallback(
        item => {
            showConfirmation(async () => {
                const response = await deleteIt({
                    variables: item
                });

                const error = response?.data?.pageBuilder?.deletePageBuilderPage?.error;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(t`Page "{slug}" deleted.`({ slug: item.slug }));

                if (slug === item.slug) {
                    history.push(`/page-builder/pages`);
                }
            });
        },
        [slug]
    );

    const { identity } = useSecurity();
    // TODO remove
    // eslint-disable-next-line
    const pbPagePermission = useMemo(() => {
        return identity.getPermission("pb.page");
    }, []);

    const loading = [listQuery, deleteMutation].find(item => item.loading);
    const query = new URLSearchParams(location.search);

    return (
        <DataList
            loading={Boolean(loading)}
            data={data}
            title={t`Pages`}
            refresh={listQuery.refetch}
        >
            {({ data }) => (
                <ScrollList>
                    {data.map(page => (
                        <ListItem key={page.id}>
                            <ListItemText
                                onClick={() => {
                                    query.set("id", page.id);
                                    history.push({ search: query.toString() });
                                }}
                            >
                                {page.title}
                                <ListTextOverline>{page?.category?.name}</ListTextOverline>
                                {page.createdBy && (
                                    <ListItemTextSecondary>
                                        Created by: {page.createdBy.firstName || "N/A"}. Last
                                        modified: <TimeAgo datetime={page.savedOn} />.
                                    </ListItemTextSecondary>
                                )}
                            </ListItemText>
                            <ListItemMeta className={rightAlign}>
                                <Typography use={"subtitle2"}>
                                    {page.locked ? "Published" : "Draft"} (v{page.version})
                                </Typography>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </ScrollList>
            )}
        </DataList>
    );
};

export default PageBuilderPagesDataList;
