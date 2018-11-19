// @flow
import React from "react";
import { get, omitBy, isNull } from "lodash";
import { Grid, Cell } from "webiny-ui/Grid";
import { Select } from "webiny-ui/Select";
import { Input } from "webiny-ui/Input";
import { ButtonPrimary, ButtonSecondary } from "webiny-ui/Button";
import { Form } from "webiny-form";
import MenuItems from "./MenuItemsForm/MenuItems";
import findObject from "./MenuItemsForm/findObject";
import PagesAutoComplete from "./MenuItemsForm/PagesAutoComplete";
import CategoriesAutoComplete from "./MenuItemsForm/CategoriesAutoComplete";
import TagsAutoComplete from "webiny-app-cms/admin/components/TagsAutoComplete";
import uniqid from "uniqid";

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("Cms.MenusForm.MenuItemsForm");

const blankFormData = {
    type: "link",
    title: "",
    items: null
};

type Props = {
    onChange: Function,
    value: any,
    menuForm: *
};

type State = {
    currentMenuItem: ?Object
};

class MenuItemsForm extends React.Component<Props, State> {
    form = React.createRef();

    state = {
        currentMenuItem: null
    };

    setCurrentItem = (data: ?Object) => {
        const { current: form } = this.form;
        form && form.setState({ data: data || blankFormData });
    };

    render() {
        const { value: items, onChange } = this.props;

        return (
            <Form
                ref={this.form}
                data={this.state.currentMenuItem || blankFormData}
                onSubmit={data => {
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

                    const { current: form } = this.form;
                    form && form.setState({ data: blankFormData });
                }}
            >
                {({ data, form, Bind }) => (
                    <Grid>
                        <Cell span={5}>
                            {data.id ? "Edit menu item" : "Add menu item"}
                            <>
                                <Grid>
                                    <Cell span={12}>
                                        <Bind name="type" validators={["required"]}>
                                            <Select label="Select menu item type">
                                                <option value="link">Link</option>
                                                <option value="group">Group</option>
                                                <option value="page">Page</option>
                                                <option value="pagesList">Pages List</option>
                                            </Select>
                                        </Bind>
                                    </Cell>
                                </Grid>
                                <br />
                                <Grid>
                                    {data.type === "link" && (
                                        <>
                                            <Cell span={12}>
                                                <Bind name="title" validators={["required"]}>
                                                    <Input label={t`Title`} />
                                                </Bind>
                                            </Cell>
                                            <Cell span={12}>
                                                <Bind name="url" validators={["required"]}>
                                                    <Input label="URL" />
                                                </Bind>
                                            </Cell>
                                        </>
                                    )}

                                    {data.type === "group" && (
                                        <Cell span={12}>
                                            <Bind name="title" validators={["required"]}>
                                                <Input label="Title" />
                                            </Bind>
                                        </Cell>
                                    )}

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
                                                        <option value="publishedOn">
                                                            {t`Published on`}
                                                        </option>
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
                                                        <Select
                                                            label="Tags rule..."
                                                            validators={["required"]}
                                                        >
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
                                                onClick={() => this.setCurrentItem()}
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
                        </Cell>
                        <Cell span={7}>
                            Menu structure
                            <MenuItems
                                menuForm={this.props.menuForm}
                                items={items}
                                onChange={onChange}
                                setCurrentItem={this.setCurrentItem}
                            />
                        </Cell>
                    </Grid>
                )}
            </Form>
        );
    }
}

export default MenuItemsForm;
