// @flow
import React from "react";
import { omitBy, isNull } from "lodash";
import { Grid, Cell } from "webiny-ui/Grid";
import { Select } from "webiny-ui/Select";
import { Input } from "webiny-ui/Input";
import { ButtonPrimary, ButtonSecondary } from "webiny-ui/Button";
import { Form } from "webiny-form";
import MenuItems from "./MenuItems";
import findObject from "./findObject";

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("Cms.MenusForm.MenuItemsForm");

const blankFormData = {
    type: "group",
    article: null,
    url: null,
    title: "",
    items: null,
    tags: [],
    tagsRule: null
};

type Props = {
    onChange: Function,
    value: any
};

type State = {
    currentMenuItem: ?Object
};

class MenuItemsForm extends React.Component<Props, State> {
    form = React.createRef();

    state = {
        currentMenuItem: null
    };

    /*  renderMenuItemForm(data: Object, form: Form) {
        switch (data.type) {
            case "link":
                return (
                    <wrapper>
                        <Input
                            placeholder="Enter link URL"
                            name="url"
                            validators={["required", "url"]}
                        />
                        <Input
                            placeholder="Enter menu title"
                            name="title"
                            validators={["required"]}
                        />
                    </wrapper>
                );
            case "article":
                const articlesProps = {
                    api: "/entities/the-hub/articles",
                    placeholder: "Type to find an article",
                    fields: "id,title,category.title",
                    name: "article",
                    textAttr: "title",
                    searchFields: "title",
                    validators: ["required"],
                    useDataAsValue: true,
                    formatValue: ({ value }) => {
                        if (!data.title) {
                            form.setData({ title: value.title });
                        }
                        return value.id;
                    },
                    optionRenderer: ({ option }) => {
                        return (
                            <span>{`${option.data.title} (${option.data.category.title})`}</span>
                        );
                    }
                };
                return (
                    <wrapper>
                        <AutoComplete {...articlesProps} />
                        <Input placeholder="Enter menu title" name="title" validators="required" />
                    </wrapper>
                );
            case "articlesList":
                const categoryProps = {
                    api: "/entities/the-hub/categories",
                    textAttr: "title",
                    fields: "id,title,icon",
                    optionRenderer: ({ option }) => {
                        return (
                            <div>
                                <Icon icon={option.data.icon} /> {option.data.title}
                            </div>
                        );
                    },
                    selectedRenderer: params => categoryProps.optionRenderer(params)
                };
                return (
                    <wrapper>
                        <Input
                            placeholder="Enter menu title"
                            name="title"
                            validators={["required"]}
                        />
                        <Select
                            name="category"
                            placeholder="Category..."
                            validators={["required"]}
                            {...categoryProps}
                        />
                        <Select name="sortBy" placeholder="Sort by..." validators={["required"]}>
                            <option value="publishedOn">Published on</option>
                            <option value="title">Title</option>
                        </Select>
                        <Select
                            name="sortDir"
                            placeholder="Sort direction..."
                            validators={["required"]}
                        >
                            <option value="1">Ascending</option>
                            <option value="-1">Descending</option>
                        </Select>
                        <Tags name="tags" placeholder="Filter by tags..." />
                        {get(data, "tags.length", 0) > 0 && (
                            <Select
                                name="tagsRule"
                                placeholder="Select tags rule..."
                                validators={["required"]}
                            >
                                <option value="all">Must include all tags</option>
                                <option value="any">Must include any of the tags</option>
                            </Select>
                        )}
                    </wrapper>
                );
            default:
                return null;
        }
    }
*/

    setCurrentItem = data => {
        this.form.current.setState({ data: data || blankFormData });
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
                        target.source[target.index] = item;
                        onChange([...items]);
                    } else {
                        item.id = +new Date();
                        console.log("changeam", [...items, item]);
                        onChange([...items, item]);
                    }

                    this.form.current.setState({ data: blankFormData });
                }}
            >
                {({ data, form, Bind }) => (
                    <Grid>
                        <Cell span={6}>
                            {data.id ? "Edit menu item" : "Add menu item"}
                            <>
                                <Grid>
                                    <Cell span={12}>
                                        <Bind name="type">
                                            <Select
                                                placeholder="Select menu item type"
                                                validators={["required"]}
                                            >
                                                <option value="link">Link</option>
                                                <option value="group">Group</option>
                                                {/*<option value="article">Article</option>
                                                <option value="articlesList">Articles List</option>*/}
                                            </Select>
                                        </Bind>
                                    </Cell>
                                </Grid>
                                <br />
                                <Grid>
                                    {data.type === "link" && (
                                        <>
                                            <Cell span={12}>
                                                <Bind name="title">
                                                    <Input
                                                        label={t`Title`}
                                                        placeholder="Enter title"
                                                        validators={["required"]}
                                                    />
                                                </Bind>
                                            </Cell>
                                            <Cell span={12}>
                                                <Bind name="url">
                                                    <Input label="URL" validators={["required"]} />
                                                </Bind>
                                            </Cell>
                                        </>
                                    )}

                                    {data.type === "group" && (
                                        <Cell span={12}>
                                            <Bind name="title">
                                                <Input
                                                    placeholder="Enter title"
                                                    validators={["required"]}
                                                />
                                            </Bind>
                                        </Cell>
                                    )}

                                    {data.type && (
                                        <Cell span={12}>
                                            <ButtonSecondary
                                                type="primary"
                                                onClick={this.setCurrentItem}
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
                        <Cell span={6}>
                            Menu structure
                            <MenuItems
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
