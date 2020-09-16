import * as React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { TagsMultiAutocomplete } from "@webiny/app-page-builder/admin/components/TagsMultiAutocomplete";
import { CategoriesAutocomplete } from "@webiny/app-page-builder/admin/components/CategoriesAutocomplete";

const MenuFilterSettings = ({ Bind }) => {
    /*
                     id
                    title
                    url
                    fullUrl
                    snippet
                    publishedOn
                     settings {
                        general {
                            image {
                                src
                            }
                        }
                    }
                    createdBy {
                        firstName
                        lastName
                    }
                    category {
                        id
                        name
                    }
    */
   /*
                   data {
                    id
                    title
                    slug
                    description
                    createdOn
                }
   */
    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"category"}>
                        <CategoriesAutocomplete label="Category" />
                    </Bind>
                </Cell>
                <Cell span={6}>
                    <Bind name={"sortBy"} defaultValue={"createdOn"}>
                        <Select label={"Sort by"}>
                            <option value={"createdOn"}>Date Created</option>
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
                        <TagsMultiAutocomplete
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
    )
}

export default MenuFilterSettings;
