// @flow
import * as React from "react";
import { get } from "lodash";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonSecondary, ButtonPrimary } from "@webiny/ui/Button";
import { Select } from "@webiny/ui/Select";
import { TagsMultiAutoComplete } from "@webiny/app-page-builder/admin/components/TagsMultiAutoComplete";
import { CategoriesAutoComplete } from "@webiny/app-page-builder/admin/components/CategoriesAutoComplete";
import { Elevation } from "@webiny/ui/Elevation";
import { validation } from "@webiny/validation";

const LinkForm = ({ data, onSubmit, onCancel }: Object) => {
    return (
        <Elevation z={4}>
            <Form data={data} onSubmit={onSubmit}>
                {({ submit, Bind }) => (
                    <>
                        <Grid>
                            <Cell span={12}>
                                <Typography use={"overline"}>Page list menu item</Typography>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="title" validators={validation.create("required")}>
                                    <Input label="Title" />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="category" validators={validation.create("required")}>
                                    <CategoriesAutoComplete label="Category" />
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
                                    <Select label="Sort by...">
                                        <option value="publishedOn">Published on</option>
                                        <option value="title">Title</option>
                                    </Select>
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="sortDir" defaultValue={"-1"} validators={validation.create("required")}>
                                    <Select label="Sort direction...">
                                        <option value="1">Ascending</option>
                                        <option value="-1">Descending</option>
                                    </Select>
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="tags">
                                    <TagsMultiAutoComplete />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                {get(data, "tags.length", 0) > 0 && (
                                    <Bind name="tagsRule" defaultValue={"ALL"}>
                                        <Select label="Tags rule..." validators={validation.create("required")}>
                                            <option value="ALL">Must include all tags</option>
                                            <option value="ANY">
                                                Must include any of the tags
                                            </option>
                                        </Select>
                                    </Bind>
                                )}
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <ButtonSecondary onClick={onCancel}>Cancel</ButtonSecondary>
                                <ButtonPrimary onClick={submit} style={{ float: "right" }}>
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
