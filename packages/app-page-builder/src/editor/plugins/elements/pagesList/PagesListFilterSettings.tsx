import * as React from "react";
import { TagsMultiAutocomplete } from "@webiny/app-page-builder/admin/components/TagsMultiAutocomplete";
import { CategoriesAutocomplete } from "@webiny/app-page-builder/admin/components/CategoriesAutocomplete";
import Accordion from "../../elementSettings/components/Accordion";
import Wrapper from "../../elementSettings/components/Wrapper";
import SelectField from "../../elementSettings/components/SelectField";
import { classes } from "../../elementSettings/components/StyledComponents";

const PagesListFilterSettings = ({ Bind }) => {
    return (
        <Accordion title={"Filter"} defaultValue={true}>
            <React.Fragment>
                <Wrapper label={"Category"} containerClassName={classes.simpleGrid}>
                    <Bind name={"category"}>
                        <CategoriesAutocomplete label="Category" />
                    </Bind>
                </Wrapper>
                <Wrapper label={"Sort By"} containerClassName={classes.simpleGrid}>
                    <Bind name={"sortBy"} defaultValue={"publishedOn"}>
                        {({ value, onChange }) => (
                            <SelectField value={value} onChange={onChange}>
                                <option value={"publishedOn"}>Publishing date</option>
                                <option value={"title"}>Title</option>
                            </SelectField>
                        )}
                    </Bind>
                </Wrapper>
                <Wrapper label={"Sort Direction"} containerClassName={classes.simpleGrid}>
                    <Bind name={"sortDirection"} defaultValue={-1}>
                        {({ value, onChange }) => (
                            <SelectField value={value} onChange={onChange}>
                                <option value={-1}>Descending</option>
                                <option value={1}>Ascending</option>
                            </SelectField>
                        )}
                    </Bind>
                </Wrapper>
                <Wrapper label={"Tags"} containerClassName={classes.simpleGrid}>
                    <Bind name="tags">
                        <TagsMultiAutocomplete
                            label="Filter by tags"
                            description="Enter tags to filter pages"
                        />
                    </Bind>
                </Wrapper>
                <Wrapper
                    label={"Filter by tags rule"}
                    containerClassName={classes.simpleGrid}
                    leftCellSpan={12}
                    rightCellSpan={12}
                >
                    <Bind name={"tagsRule"} defaultValue={"ALL"}>
                        {({ value, onChange }) => (
                            <SelectField value={value} onChange={onChange}>
                                <option value={"ALL"}>Page must include all tags</option>
                                <option value={"ANY"}>Page must include any of the tags</option>
                            </SelectField>
                        )}
                    </Bind>
                </Wrapper>
            </React.Fragment>
        </Accordion>
    );
};

export default PagesListFilterSettings;
