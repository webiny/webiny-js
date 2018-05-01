import React, { Fragment } from "react";
import _ from "lodash";
import { createComponent, i18n } from "webiny-app";
import InfiniteScroll from "react-infinite-scroller";

import { PageDetailsProvider } from "./context/PageDetailsContext";
import PageFilter from "./components/PageFilter";
import PageListControls from "./components/PageListControls";
import PageList from "./components/PageList";
import PageDetails from "./components/PageDetails";
import CreatePageDialog from "./components/CreatePageDialog";

import styles from "./PageManager.scss?prefix=Webiny_CMS_PageManager";

const t = i18n.namespace("Cms.Admin.Views.PageManager");

class PageManager extends React.Component {
    constructor() {
        super();

        this.state = {
            page: null,
            category: null
        };
    }

    render() {
        const { Modal, ViewSwitcher, View, Link, Icon, Grid, Scrollbar } = this.props.modules;
        const {
            list,
            hasMore,
            setSearchQuery,
            setFilter,
            filter,
            search,
            loadMore,
            deletePage,
            removePageFromList
        } = this.props;

        const page = _.find(list, { id: this.state.page });

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
                    <ViewSwitcher onReady={actions => (this.viewSwitcher = actions)}>
                        <ViewSwitcher.View name={"manager"} defaultView>
                            {() => (
                                <Fragment>
                                    <Grid.Row>
                                        <Grid.Col all={12} className={styles.noPadding}>
                                            <PageFilter
                                                query={search.query}
                                                setSearchQuery={setSearchQuery}
                                                setFilter={setFilter}
                                            />
                                        </Grid.Col>
                                    </Grid.Row>
                                    <Grid.Row className={styles.listLayout}>
                                        <Grid.Col all={4} className={styles.sidebar}>
                                            <div className={styles.sidebarHeader}>
                                                <PageListControls
                                                    category={filter.category}
                                                    onCategory={cat => setFilter({ category: cat })}
                                                />
                                            </div>

                                            <Scrollbar style={{ height: 800 }}>
                                                <InfiniteScroll
                                                    initialLoad={false}
                                                    loadMore={loadMore}
                                                    hasMore={hasMore}
                                                    useWindow={false}
                                                    threshold={100}
                                                >
                                                    <PageList
                                                        pages={list}
                                                        onPageClick={page =>
                                                            this.setState({ page: page.id })
                                                        }
                                                    />
                                                </InfiniteScroll>
                                            </Scrollbar>
                                        </Grid.Col>
                                        <Grid.Col all={8} className={styles.noPadding}>
                                            <PageDetailsProvider value={{ page }}>
                                                <PageDetails
                                                    deleteConfirmation={() =>
                                                        this.viewSwitcher.showView(
                                                            "deleteConfirmation"
                                                        )(page)
                                                    }
                                                    page={page}
                                                />
                                            </PageDetailsProvider>
                                        </Grid.Col>
                                    </Grid.Row>
                                </Fragment>
                            )}
                        </ViewSwitcher.View>
                        <ViewSwitcher.View name={"deleteConfirmation"} modal>
                            {({ data }) => (
                                <Modal.Confirmation
                                    name={"deleteConfirmation"}
                                    confirm={"Yes, delete it!"}
                                    cancel={"Not now"}
                                    message={
                                        <span>
                                            Are you sure you want to delete the page <br />
                                            <strong>{data.title}</strong>
                                            <br /> and all of its revisions?
                                        </span>
                                    }
                                    onConfirm={() => deletePage(data.id)}
                                    onComplete={() => removePageFromList(data.id)}
                                />
                            )}
                        </ViewSwitcher.View>
                    </ViewSwitcher>
                </View.Body>
            </View.List>
        );
    }
}

export default createComponent(PageManager, {
    modules: [
        "View",
        "ViewSwitcher",
        "Link",
        "Icon",
        "Input",
        "Grid",
        "Modal",
        "Button",
        "Scrollbar"
    ]
});
