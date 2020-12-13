import * as React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { TagsMultiAutocomplete } from "@webiny/app-page-builder/admin/components/TagsMultiAutocomplete";
import { CategoriesAutocomplete } from "@webiny/app-page-builder/admin/components/CategoriesAutocomplete";

const PagesListFilterSettings = ({ Bind }) => {
    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"category"}>
                        <CategoriesAutocomplete label="Category" />
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
                    <Bind name={"sortDirection"} defaultValue={"desc"}>
                        <Select label={"Sort direction"}>
                            <option value={"desc"}>Descending</option>
                            <option value={"asc"}>Ascending</option>
                        </Select>
                    </Bind>
                </Cell>
                <Cell span={6}>
                    <Bind name="tags">
                        <TagsMultiAutocomplete
                            label="Filter by tags"
                            description="Enter tags to filter pages"
                        />
                    </Bind>
                </Cell>
                <Cell span={6}>
                    <Bind name={"tagsRule"} defaultValue={"all"}>
                        <Select label={"Filter by tags rule"}>
                            <option value={"all"}>Page must include all tags</option>
                            <option value={"any"}>Page must include any of the tags</option>
                        </Select>
                    </Bind>
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default PagesListFilterSettings;
