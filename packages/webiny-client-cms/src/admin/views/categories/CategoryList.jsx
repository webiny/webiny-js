import React from "react";
import { createComponent } from "webiny-client";
import CategoryModal from "./CategoryModal";

class CategoryList extends React.Component {
    render() {
        const {
            View,
            ViewSwitcher,
            Link,
            Icon,
            List,
            ListData,
            List: { Table }
        } = this.props.modules;

        return (
            <View.List>
                <View.Header
                    title="Categories"
                    description={"Page categories help organize your content."}
                >
                    <Link
                        type="primary"
                        align="right"
                        onClick={() => this.viewSwitcher.showView("form")()}
                    >
                        <Icon icon={["fa", "plus-circle"]} />
                        Create new category
                    </Link>
                </View.Header>
                <View.Body>
                    <ViewSwitcher onReady={viewSwitcher => (this.viewSwitcher = viewSwitcher)}>
                        <ViewSwitcher.View name={"list"} defaultView>
                            {({ showView }) => (
                                <ListData
                                    onReady={actions => (this.list = actions)}
                                    entity={"CmsCategory"}
                                    fields={"id title slug url createdOn"}
                                    perPage={10}
                                >
                                    {listProps => (
                                        <List {...listProps}>
                                            <Table>
                                                <Table.Row>
                                                    <Table.Field
                                                        name="title"
                                                        align="left"
                                                        label="Title"
                                                        sort="title"
                                                    >
                                                        {({ data }) => (
                                                            <div>
                                                                <a
                                                                    href="#"
                                                                    onClick={() =>
                                                                        showView("form")(data)
                                                                    }
                                                                >
                                                                    <strong>{data.title}</strong>
                                                                </a>
                                                                <br />
                                                                <span style={{ color: "#999" }}>
                                                                    ID: {data.id}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </Table.Field>
                                                    <Table.Field
                                                        name="slug"
                                                        align="left"
                                                        label="Slug"
                                                        sort="slug"
                                                    />
                                                    <Table.Field
                                                        name="url"
                                                        align="left"
                                                        label="URL"
                                                        sort="url"
                                                    />
                                                    <Table.DateTimeField
                                                        name="createdOn"
                                                        align="left"
                                                        label="Date "
                                                        sort="createdOn"
                                                    />
                                                    <Table.Actions>
                                                        <Table.EditAction
                                                            onClick={params =>
                                                                showView("form")(params.data)
                                                            }
                                                        />
                                                        <Table.DeleteAction />
                                                    </Table.Actions>
                                                </Table.Row>
                                            </Table>
                                            <List.Pagination />
                                        </List>
                                    )}
                                </ListData>
                            )}
                        </ViewSwitcher.View>
                        <ViewSwitcher.View name={"form"} modal>
                            {({ data }) => (
                                <CategoryModal
                                    name="createCategory"
                                    data={data}
                                    onSuccess={() => this.list.loadRecords()}
                                />
                            )}
                        </ViewSwitcher.View>
                    </ViewSwitcher>
                </View.Body>
            </View.List>
        );
    }
}

export default createComponent(CategoryList, {
    modules: ["ViewSwitcher", "View", "Link", "Icon", "List", "ListData"]
});
