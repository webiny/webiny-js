// @flow
import React from "react";
import { omitBy, isNull } from "lodash";
import { Grid, Cell } from "webiny-ui/Grid";
import { Select } from "webiny-ui/Select";
import { Input } from "webiny-ui/Input";
import { ButtonPrimary } from "webiny-ui/Button";
import { Form } from "webiny-form";
// import { AutoComplete } from "webiny-ui/AutoComplete";

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
    item: ?Object,
    onSubmit: Function,
    onCancel: Function
};

class AddMenuItem extends React.Component<Props> {
    form = React.createRef();

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
    render() {
        return (
            <Form
                ref={this.form}
                data={this.props.item || blankFormData}
                onSubmit={data => {
                    console.log("trigeram onsubmit");
                    this.props.onSubmit(omitBy(data, isNull));
                    /*  this.form.current.setState(state => {
                        state.data = blankFormData;
                        return state;
                    });*/
                }}
                onCancel={() => {
                    this.props.onCancel();
                }}
            >
                {({ data, form, Bind }) => (
                    <Grid>
                        <Cell all={12}>
                            <Bind name="type">
                                <Select
                                    placeholder="Select menu item type"
                                    validators={["required"]}
                                >
                                    <option value="link">Link</option>
                                    <option value="group">Group</option>
                                    <option value="article">Article</option>
                                    <option value="articlesList">Articles List</option>
                                </Select>
                            </Bind>
                            <section>
                                {data.type === "group" && (
                                    <Bind name="title">
                                        <Input
                                            placeholder="Enter group title"
                                            validators={["required"]}
                                        />
                                    </Bind>
                                )}
                            </section>
                        </Cell>
                        {data.type && (
                            <Cell all={12}>
                                <ButtonPrimary align="left" type="default" onClick={form.cancel}>
                                    Cancel
                                </ButtonPrimary>
                                <ButtonPrimary align="right" type="primary" onClick={form.submit}>
                                    Save
                                </ButtonPrimary>
                            </Cell>
                        )}
                    </Grid>
                )}
            </Form>
        );
    }
}

export default AddMenuItem;
