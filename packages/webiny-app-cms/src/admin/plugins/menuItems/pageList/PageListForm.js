// @flow
import * as React from "react";
import { get } from "lodash";
import { Form } from "webiny-form";
import { Input } from "webiny-ui/Input";
import { Typography } from "webiny-ui/Typography";
import { Grid, Cell } from "webiny-ui/Grid";
import { ButtonSecondary, ButtonPrimary } from "webiny-ui/Button";
import { Select } from "webiny-ui/Select";
import CategoriesAutoComplete from "./CategoriesAutoComplete";
import { SimpleTagsMultiAutoComplete } from "webiny-app-cms/admin/components";

const LinkForm = ({ data, onSubmit, onCancel }: Object) => {
    return (
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
                            <Bind name="title" validators={["required"]}>
                                <Input label="Title" />
                            </Bind>
                        </Cell>
                    </Grid>
                    <Grid>
                        <Cell span={12}>
                            <Bind name="category" validators={["required"]}>
                                <CategoriesAutoComplete label="Category" />
                            </Bind>
                        </Cell>
                    </Grid>
                    <Grid>
                        <Cell span={12}>
                            <Bind
                                name="sortBy"
                                defaultValue={"publishedOn"}
                                validators={["required"]}
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
                            <Bind name="sortDir" defaultValue={"-1"} validators={["required"]}>
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
                                <SimpleTagsMultiAutoComplete />
                            </Bind>
                        </Cell>
                    </Grid>
                    <Grid>
                        <Cell span={12}>
                            {get(data, "tags.length", 0) > 0 && (
                                <Bind name="tagsRule" defaultValue={"all"}>
                                    <Select label="Tags rule..." validators={["required"]}>
                                        <option value="all">Must include all tags</option>
                                        <option value="any">Must include any of the tags</option>
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
    );
};

export default LinkForm;
