import * as React from "react";
import { css } from "emotion";
import { TagsMultiAutocomplete } from "../../../../admin/components/TagsMultiAutocomplete";
import { CategoriesAutocomplete } from "../../../../admin/components/CategoriesAutocomplete";
import Accordion from "../../elementSettings/components/Accordion";
import Wrapper from "../../elementSettings/components/Wrapper";
import SelectField from "../../elementSettings/components/SelectField";
import {
    ButtonContainer,
    classes,
    COLORS,
    SimpleButton
} from "../../elementSettings/components/StyledComponents";
import { Cell, Grid } from "@webiny/ui/Grid";
import { BindComponent } from "@webiny/form";

const autoCompleteStyle = css({
    "& .mdc-text-field": {
        height: "30px !important",
        padding: "0px !important"
    },
    "& .mdc-text-field__input": {
        padding: "4px 8px !important",
        border: "none !important",
        backgroundColor: `${COLORS.lightGray} !important`,
        caretColor: "inherit !important"
    },
    "& .mdc-floating-label": {
        display: "none"
    },
    "& .mdc-line-ripple": {
        display: "none"
    },
    "& .mdc-elevation--z1": {
        top: "30px !important"
    }
});

interface PagesListFilterSettingsProps {
    Bind: BindComponent;
    submit: (event: React.MouseEvent) => void;
}
const PagesListFilterSettings = ({ Bind, submit }: PagesListFilterSettingsProps) => {
    return (
        <Accordion title={"Filter"} defaultValue={true}>
            <React.Fragment>
                <Wrapper label={"Category"} containerClassName={classes.simpleGrid}>
                    <Bind name={"category"}>
                        <CategoriesAutocomplete label="Category" className={autoCompleteStyle} />
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
                    <Bind name={"sortDirection"} defaultValue={"desc"}>
                        {({ value, onChange }) => (
                            <SelectField value={value} onChange={onChange}>
                                <option value={"desc"}>Descending</option>
                                <option value={"asc"}>Ascending</option>
                            </SelectField>
                        )}
                    </Bind>
                </Wrapper>
                <Wrapper label={"Tags"} containerClassName={classes.simpleGrid}>
                    <Bind name="tags">
                        <TagsMultiAutocomplete
                            className={autoCompleteStyle}
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
                    <Bind name={"tagsRule"} defaultValue={"all"}>
                        {({ value, onChange }) => (
                            <SelectField value={value} onChange={onChange}>
                                <option value={"all"}>Page must include all tags</option>
                                <option value={"any"}>Page must include any of the tags</option>
                            </SelectField>
                        )}
                    </Bind>
                </Wrapper>
                <Grid className={classes.simpleGrid}>
                    <Cell span={12}>
                        <ButtonContainer>
                            <SimpleButton onClick={submit}>Save</SimpleButton>
                        </ButtonContainer>
                    </Cell>
                </Grid>
            </React.Fragment>
        </Accordion>
    );
};

export default PagesListFilterSettings;
