// @flow
import * as React from "react";
import { compose } from "recompose";
import { get } from "dot-prop-immutable";
import { withDataList, withRouter } from "webiny-app/components";
import { i18n } from "webiny-app/i18n";
import { DataList, List, ListItem, ListItemText, ListItemTextSecondary } from "webiny-ui/List";

import { loadPages } from "./graphql";

const t = i18n.namespace("Cms.PagesDataList");

const PagesDataList = props => {
    const { PagesDataList, router } = props;

    const { data, meta } = get(PagesDataList, "data.cms.pages") || { data: [], meta: {} };

    return (
        <DataList
            {...PagesDataList}
            data={data}
            meta={meta}
            title={t`CMS Pages`}
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
                <List>
                    {data.map(page => (
                        <ListItem key={page.id}>
                            <ListItemText
                                onClick={() =>
                                    router.goToRoute({
                                        params: { id: page.activeRevision.id },
                                        merge: true
                                    })
                                }
                            >
                                {page.activeRevision.title}
                                <ListItemTextSecondary>
                                    {page.activeRevision.slug}
                                </ListItemTextSecondary>
                            </ListItemText>
                        </ListItem>
                    ))}
                </List>
            )}
        </DataList>
    );
};

export default compose(
    withRouter(),
    withDataList({
        name: "PagesDataList",
        query: loadPages,
        variables: {
            sort: { savedOn: -1 }
        }
    })
)(PagesDataList);
