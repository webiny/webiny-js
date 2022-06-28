import React from "react";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonSecondary, ButtonPrimary } from "@webiny/ui/Button";
import { Select } from "@webiny/ui/Select";
import { TagsMultiAutocomplete } from "~/admin/components/TagsMultiAutocomplete";
import { CategoriesAutocomplete } from "~/admin/components/CategoriesAutocomplete";
import { Elevation } from "@webiny/ui/Elevation";
import { validation } from "@webiny/validation";
import { FormOnSubmit } from "@webiny/form/types";
import { MenuTreeItem } from "~/admin/views/Menus/types";

const menuPageFormStyle = {
    color: "var(--mdc-theme-on-surface)",
    backgroundColor: "var(--mdc-theme-background) !important"
};

interface LinkFormProps {
    data: MenuTreeItem;
    onSubmit: FormOnSubmit;
    onCancel: () => void;
}
const LinkForm: React.FC<LinkFormProps> = ({ data, onSubmit, onCancel }) => {
    return (
        <Elevation z={4} css={menuPageFormStyle}>
            <Form data={data} onSubmit={onSubmit}>
                {({ Bind, submit, data: formData }) => (
                    <>
                        <Grid>
                            <Cell span={12}>
                                <Typography use={"overline"}>Page list menu item</Typography>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="title" validators={validation.create("required")}>
                                    <Input label="Title" data-testid="pb.menu.new.listitem.title" />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="category" validators={validation.create("required")}>
                                    <CategoriesAutocomplete label="Category" data-testid="pb.menu.new.listitem.title"/>
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind
                                    name="sortBy"
                                    defaultValue={"publishedOn"}
                                    validators={validation.create("required")}
                                >
                                    <Select label="Sort by..." data-testid="pb.menu.new.listitem.title">
                                        <option value="publishedOn">Published on</option>
                                        <option value="title">Title</option>
                                    </Select>
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind
                                    name="sortDir"
                                    defaultValue={"desc"}
                                    validators={validation.create("required")}
                                >
                                    <Select label="Sort direction..." data-testid="pb.menu.new.listitem.title">
                                        <option value="asc">Ascending</option>
                                        <option value="desc">Descending</option>
                                    </Select>
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="tags">
                                    <TagsMultiAutocomplete />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                {formData.tags && formData.tags.length > 0 && (
                                    <Bind
                                        name="tagsRule"
                                        defaultValue={"all"}
                                        validators={validation.create("required")}
                                    >
                                        <Select label="Tags rule..." data-testid="pb.menu.new.listitem.title">
                                            <option value="all">Must include all tags</option>
                                            <option value="any">
                                                Must include any of the tags
                                            </option>
                                        </Select>
                                    </Bind>
                                )}
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <ButtonSecondary onClick={onCancel} data-testid="pb.menu.new.listitem.button.cancel">Cancel</ButtonSecondary>
                                <ButtonPrimary
                                    onClick={ev => {
                                        submit(ev);
                                    }}
                                    style={{ float: "right" }}
                                    data-testid="pb.menu.new.listitem.button.save"
                                >
                                    Save menu item
                                </ButtonPrimary>
                            </Cell>
                        </Grid>
                    </>
                )}
            </Form>
        </Elevation>
    );
};

export default LinkForm;
