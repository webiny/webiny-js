import React from "react";
import { createComponent, i18n } from "webiny-app";
import PageFilter from "./components/PageFilter";
import PageListControls from "./components/PageListControls";
import PageContentPreview from "./components/PageContentPreview";
import CreatePageDialog from "./CreatePageDialog";
import styles from "./PageList.scss";

const t = i18n.namespace("Cms.Admin.Views.PageList");

class PageList extends React.Component {
    constructor() {
        super();

        this.state = {
            category: null
        };
    }

    render() {
        const {
            //List,
            ListData,
            View,
            Link,
            Icon,
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
                    <Link type="primary" align="right" onClick={() => this.createModal.show()}>
                        <Icon icon={["fa", "plus-circle"]} /> {t`Create new page`}
                    </Link>
                    <CreatePageDialog onReady={ref => (this.createModal = ref)} />
                </View.Header>
                <View.Body noPadding noColor>
                    <ListData
                        entity={"CmsPage"}
                        fields={
                            "id title slug category { title } content { id type origin data settings }"
                        }
                    >
                        {({ list }) => (
                            <React.Fragment>
                                <Grid.Row>
                                    <Grid.Col all={12}>
                                        <PageFilter />
                                    </Grid.Col>
                                </Grid.Row>

                                <Grid.Row>
                                    <Grid.Col all={4} className={styles.noPaddingRight}>
                                        <div className={styles.sidebar}>
                                            <div className={styles.sidebarHeader}>
                                                <PageListControls
                                                    category={this.state.category}
                                                    onCategory={cat =>
                                                        this.setState({ category: cat })
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <ul>
                                            {list.map(page => (
                                                <li
                                                    key={page.id}
                                                    onClick={() => this.setState({ page })}
                                                >
                                                    <strong>{page.title}</strong>
                                                    <br />
                                                    {page.category.title}
                                                </li>
                                            ))}
                                        </ul>
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
                                                    {this.state.page && (
                                                        <PageContentPreview
                                                            content={this.state.page.content}
                                                        />
                                                    )}
                                                </div>
                                            </Tabs.Tab>
                                            <Tabs.Tab label="Revisions" />
                                        </Tabs>
                                    </Grid.Col>
                                </Grid.Row>
                            </React.Fragment>
                        )}
                    </ListData>
                </View.Body>
            </View.List>
        );
    }
}

export default createComponent(PageList, {
    modules: [
        "ListData",
        "View",
        "Link",
        "Icon",
        "Input",
        "Select",
        "Checkbox",
        "Grid",
        "Modal",
        "Tabs",
        "Button"
    ]
});
