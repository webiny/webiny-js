// @flow
import * as React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { Select } from "webiny-ui/Select";
import { withCms } from "webiny-app-cms/context";
import { TagsMultiAutoComplete, CategoriesAutoComplete } from "webiny-app-cms/admin/components";

const PagesListFilterSettings = ({ Bind }: Object) => {
    return (
        <React.Fragment>
            <Grid>
                <Cell span={6}>
                    <Bind name={"category"}>
                        <CategoriesAutoComplete label="Category" />
                    </Bind>
                </Cell>
                <Cell span={6}>
                    <Bind name={"pagesLimit"} validators={"numeric"}>
                        <Input
                            label={"Number of pages to show"}
                            description={"Leave empty to show all"}
                        />
                    </Bind>
                </Cell>
                <Cell span={6}>
                    <Bind name={"sortBy"} defaultValue={"publishedOn"}>
                        <Select label={"Sort by"}>
                            <option value={"publishedOn"}>Publishing date</option>
                            <option value={"title"}>Title</option>
                        </Select>
                    </Bind>
                </Cell>
                <Cell span={6}>
                    <Bind name={"sortDirection"} defaultValue={-1}>
                        <Select label={"Sort direction"}>
                            <option value={-1}>Descending</option>
                            <option value={1}>Ascending</option>
                        </Select>
                    </Bind>
                </Cell>
                <Cell span={6}>
                    <Bind name="tags">
                        <TagsMultiAutoComplete
                            label="Filter by tags"
                            description="Enter tags to filter pages"
                        />
                    </Bind>
                </Cell>
                <Cell span={6}>
                    <Bind name={"tagsRule"} defaultValue={"ALL"}>
                        <Select label={"Filter by tags rule"}>
                            <option value={"ALL"}>Page must include all tags</option>
                            <option value={"ANY"}>Page must include any of the tags</option>
                        </Select>
                    </Bind>
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default withCms()(PagesListFilterSettings);
