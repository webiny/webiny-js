// @flow
import * as React from "react";
import { Select } from "webiny-ui/Select";
import { Grid, GridInner, Cell } from "webiny-ui/Grid";
import { Typography } from "webiny-ui/Typography";
import type { SearchPlugin } from "webiny-app-admin/types";

// Categories plugin
export const categories: SearchPlugin = {
    name: "global-search-cms-categories",
    type: "global-search",
    labels: {
        option: "Categories",
        search: "Search categories"
    },
    route: "Cms.Categories"
};

// Pages plugin
export const pages: SearchPlugin = {
    name: "global-search-cms-pages",
    type: "global-search",
    labels: {
        option: "Pages",
        search: "Search pages"
    },
    renderFilters({ Bind }) {
        return (
            <Grid style={{ padding: 0 }}>
                <GridInner style={{ alignItems: "baseline" }}>
                    <Cell span={3}>
                        <Typography use={"body2"}>Category</Typography>
                    </Cell>
                    <Cell span={9}>
                        <Bind name={"category"}>
                            <Select>
                                <option value={"one"}>One - 2</option>
                                <option value={"two"}>Two</option>
                            </Select>
                        </Bind>
                    </Cell>
                </GridInner>
            </Grid>
        );
    }
};
