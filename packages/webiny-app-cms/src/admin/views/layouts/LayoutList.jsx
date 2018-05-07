import React from "react";
import { createComponent } from "webiny-app";
import LayoutModal from "./LayoutModal";

class LayoutList extends React.Component {
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
                    title="Layouts"
                    description={
                        "Layouts are used to create different structure of pages and are reused throughout your website."
                    }
                >
                    <Link
                        type="primary"
                        align="right"
                        onClick={() => this.viewSwitcher.showView("form")()}
                    >
                        <Icon icon={["fa", "plus-circle"]} />
                        Create new layout
                    </Link>
                </View.Header>
                <View.Body>
                    <ViewSwitcher onReady={viewSwitcher => (this.viewSwitcher = viewSwitcher)}>
                        <ViewSwitcher.View name={"list"} defaultView>
                            {({ showView }) => (
                                <ListData
                                    onReady={actions => (this.list = actions)}
                                    entity={"CmsLayout"}
                                    fields={"id title slug createdOn"}
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
                                                                <Link
                                                                    route={"Cms.Layout.Edit"}
                                                                    params={{ id: data.id }}
                                                                >
                                                                    <strong>{data.title}</strong>
                                                                </Link>
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
                            {({ data }) => <LayoutModal name="createLayout" data={data} />}
                        </ViewSwitcher.View>
                    </ViewSwitcher>
                </View.Body>
            </View.List>
        );
    }
}

export default createComponent(LayoutList, {
    modules: ["ViewSwitcher", "View", "Link", "Icon", "List", "ListData"]
});
