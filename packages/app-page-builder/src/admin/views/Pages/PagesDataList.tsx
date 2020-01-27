import * as React from "react";
import TimeAgo from "timeago-react";
import { withRouter, WithRouterProps } from "@webiny/react-router";
import { i18n } from "@webiny/app/i18n";
import { css } from "emotion";
import { Typography } from "@webiny/ui/Typography";
import {
    DataList,
    List,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListTextOverline,
    ListItemMeta
} from "@webiny/ui/List";

const t = i18n.namespace("Pb.PagesDataList");

const rightAlign = css({
    alignItems: "flex-end !important"
});

export type PagesDataListProps = WithRouterProps<{
    dataList: any;
}>;

const PagesDataList: React.FC<PagesDataListProps> = props => {
    const { dataList, location, history } = props;
    const query = new URLSearchParams(location.search);

    return (
        <DataList
            {...dataList}
            title={t`Pages`}
            sorters={[
                {
                    label: "Newest to oldest",
                    sorters: { createdOn: -1 }
                },
                {
                    label: "Oldest to newest",
                    sorters: { createdOn: 1 }
                },
                {
                    label: "Title A-Z",
                    sorters: { title: 1 }
                },
                {
                    label: "Title Z-A",
                    sorters: { title: -1 }
                }
            ]}
        >
            {({ data = [] }) => (
                <List data-testid="default-data-list">
                    {data.map(page => (
                        <ListItem key={page.id}>
                            <ListItemText
                                onClick={() => {
                                    query.set("id", page.id);
                                    history.push({ search: query.toString() });
                                }}
                            >
                                {page.title}
                                <ListTextOverline>{page.category.name}</ListTextOverline>
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
                </List>
            )}
        </DataList>
    );
};

export default withRouter<PagesDataListProps>(PagesDataList);
