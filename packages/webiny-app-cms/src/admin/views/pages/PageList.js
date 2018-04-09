import React from "react";
import { createComponent, i18n } from "webiny-app";
import PageFilter from "./components/PageFilter";
import styles from "./PageList.scss";

const t = i18n.namespace("Cms.Admin.Views.PageList");

class PageList extends React.Component {
    render() {
        const {
            //List,
            View,
            Link,
            Icon,
            Dropdown,
            //Modal,
            //Button,
            //Input,
            Select,
            Grid,
            Tabs,
            Checkbox
        } = this.props.modules;

        return (
            <View.List>
                <View.Header
                    title={t`CMS / Pages`}
                    description={t`Your list of pages. Click the button on the right to create a new page.`}
                >
                    <Link type="primary" align="right" route={"Cms.Page.Create"}>
                        <Icon icon={["fa", "plus-circle"]} /> {t`Create new page`}
                    </Link>
                </View.Header>
                <View.Body noPadding noColor>
                    <Grid.Row>
                        <Grid.Col all={12}>
                            <PageFilter />
                        </Grid.Col>
                    </Grid.Row>

                    <Grid.Row>
                        <Grid.Col all={4} className={styles.noPaddingRight}>
                            <div className={styles.sidebar}>
                                <div className={styles.sidebarHeader}>
                                    <Grid.Row>
                                        <Grid.Col all={3}>
                                            <Dropdown title="Categories" type={"balloon"}>
                                                <Dropdown.Header title="Categories" />
                                                <Dropdown.Link onClick={() => {}} title="Insert" />
                                                <Dropdown.Link onClick={() => {}} title="Update" />
                                                <Dropdown.Link onClick={() => {}} title="Insert" />
                                            </Dropdown>
                                        </Grid.Col>
                                        <Grid.Col all={3}>
                                            <Dropdown title="Sort by" type={"balloon"}>
                                                <Dropdown.Header title="Sort by" />
                                                <Dropdown.Link onClick={() => {}} title="Insert" />
                                                <Dropdown.Link onClick={() => {}} title="Update" />
                                                <Dropdown.Link onClick={() => {}} title="Insert" />
                                            </Dropdown>
                                        </Grid.Col>
                                        <Grid.Col all={3}>
                                            <Dropdown title="Actions" type={"balloon"}>
                                                <Dropdown.Header title="Actions" />
                                                <Dropdown.Link onClick={() => {}} title="Insert" />
                                                <Dropdown.Link onClick={() => {}} title="Update" />
                                                <Dropdown.Link onClick={() => {}} title="Insert" />
                                            </Dropdown>
                                        </Grid.Col>
                                        <Grid.Col all={1} xsPush={1}>
                                            <Checkbox
                                                onChange={() => {}}
                                                value={false}
                                                style={{ marginTop: 7 }}
                                            />
                                        </Grid.Col>
                                    </Grid.Row>
                                </div>
                            </div>
                        </Grid.Col>
                        <Grid.Col all={8} className={styles.noPaddingLeft}>
                            <Tabs size="large">
                                <Tabs.Tab label="Preview page">
                                    <div className={styles.previewHeader}>
                                        <div className={styles.previewDetails}>
                                            <div>Date created: 24.5.2015</div>
                                            <div>Category: Blogging</div>
                                            <div>By: Sven al Hamad</div>
                                            <div>Status: Published</div>
                                        </div>
                                        <div className={styles.previewRevision}>
                                            <Select value={1} onChange={() => {}}>
                                                <option value={1}>Revision #1</option>
                                                <option value={2}>Revision #2</option>
                                                <option value={3}>Revision #3</option>
                                            </Select>
                                        </div>
                                    </div>
                                </Tabs.Tab>
                                <Tabs.Tab label="Revisions" />
                            </Tabs>
                        </Grid.Col>
                    </Grid.Row>
                </View.Body>
            </View.List>
        );
    }
}

export default createComponent(PageList, {
    modules: [
        "List",
        "View",
        "Link",
        "Icon",
        "Input",
        "Select",
        "Dropdown",
        "Checkbox",
        "Grid",
        "Modal",
        "Tabs",
        "Button"
    ]
});
