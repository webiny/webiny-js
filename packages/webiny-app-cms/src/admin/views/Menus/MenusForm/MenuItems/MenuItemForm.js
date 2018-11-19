// @flow
import * as React from "react";
import { compose, withHandlers } from "recompose";
import { get, omitBy, isNull } from "lodash";
import findObject from "./findObject";
import PagesAutoComplete from "./MenuItemForm/PagesAutoComplete";
import CategoriesAutoComplete from "./MenuItemForm/CategoriesAutoComplete";
import TagsAutoComplete from "webiny-app-cms/admin/components/TagsAutoComplete";
import uniqid from "uniqid";
import LinkForm from "./MenuItemForm/LinkForm";
import FolderForm from "./MenuItemForm/FolderForm";


const MenuItemForm = ({ onSubmit, onCancel, currentMenuItem }: Object) => {
    const props = { onSubmit, onCancel, data: currentMenuItem };

    switch (currentMenuItem.type) {
        case "link":
            return <LinkForm {...props} />;
        case "folder":
            return <FolderForm {...props} />;
        default:
            return null;
    }
    /*
    return (
        <Form data={currentMenuItem || blankFormData} onSubmit={onSubmit}>
            {({ data, form, Bind }) => (
                <>
                    <Grid>
                        {data.type === "page" && (
                            <>
                                <Cell span={12}>
                                    <Bind name="title" validators={["required"]}>
                                        <Input label="Title" />
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind name="page" validators={["required"]}>
                                        <PagesAutoComplete label="Page" />
                                    </Bind>
                                </Cell>
                            </>
                        )}

                        {data.type === "pagesList" && (
                            <>
                                <Cell span={12}>
                                    <Bind name="title" validators={["required"]}>
                                        <Input label="Title" />
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind name="category" validators={["required"]}>
                                        <CategoriesAutoComplete label="Category" />
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind
                                        name="sortBy"
                                        defaultValue={"publishedOn"}
                                        validators={["required"]}
                                    >
                                        <Select label="Sort by...">
                                            <option value="publishedOn">{t`Published on`}</option>
                                            <option value="title">{t`Title`}</option>
                                        </Select>
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind
                                        name="sortDir"
                                        defaultValue={"1"}
                                        validators={["required"]}
                                    >
                                        <Select label="Sort direction...">
                                            <option value="1">{t`Ascending`}</option>
                                            <option value="-1">{t`Descending`}</option>
                                        </Select>
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind name="tags">
                                        <TagsAutoComplete />
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    {get(data, "tags.length", 0) > 0 && (
                                        <Bind name="tagsRule" defaultValue={"all"}>
                                            <Select label="Tags rule..." validators={["required"]}>
                                                <option value="all">
                                                    {t`Must include all tags`}
                                                </option>
                                                <option value="any">
                                                    {t`Must include any of the tags`}
                                                </option>
                                            </Select>
                                        </Bind>
                                    )}
                                </Cell>
                            </>
                        )}

                        {data.type && (
                            <Cell span={12}>
                                <ButtonSecondary
                                    type="primary"
                                    onClick={() => this.editItem()}
                                >
                                    Cancel
                                </ButtonSecondary>
                                &nbsp;
                                <ButtonPrimary type="primary" onClick={form.submit}>
                                    Save
                                </ButtonPrimary>
                            </Cell>
                        )}
                    </Grid>
                </>
            )}
        </Form>
    );*/
};

export default compose(
    withHandlers({
        onCancel: ({ editItem }) => () => {
            editItem(null);
        },
        onSubmit: ({ items, onChange, editItem }) => data => {
            const item = omitBy(data, isNull);
            if (item.id) {
                const target = findObject(items, item.id);
                if (target) {
                    target.source[target.index] = item;
                    onChange([...items]);
                }
            } else {
                item.id = uniqid();
                onChange([...items, item]);
            }

            editItem(null);
        }
    })
)(MenuItemForm);
