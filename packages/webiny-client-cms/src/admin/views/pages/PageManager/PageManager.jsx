import React, { Fragment } from "react";
import _ from "lodash";
import { Component, i18n } from "webiny-client";
import InfiniteScroll from "react-infinite-scroller";

import { PageDetailsProvider } from "./PageDetailsContext";
import PageFilter from "./PageFilter";
import PageListControls from "./PageListControls";
import PageList from "./PageList";
import PageDetails from "./PageDetails";
import CreatePageDialog from "./CreatePageDialog";

import styles from "./PageManager.scss?prefix=wby-cms-pageManager";

const t = i18n.namespace("Cms.Admin.Views.PageManager");

@Component({
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
})
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
            moveToTrash,
            updatePage,
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
                                                filter={filter}
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
                                                        onPageClick={({ id }) =>
                                                            this.setState({ page: id })
                                                        }
                                                    />
                                                </InfiniteScroll>
                                            </Scrollbar>
                                        </Grid.Col>
                                        <Grid.Col all={8} className={styles.noPadding}>
                                            <PageDetailsProvider value={{ page }}>
                                                <PageDetails
                                                    togglePublished={() =>
                                                        updatePage(page.id, {
                                                            status:
                                                                page.status === "draft"
                                                                    ? "published"
                                                                    : "draft"
                                                        }).then(() => {
                                                            removePageFromList(page.id);
                                                            this.setState({ page: null });
                                                        })
                                                    }
                                                    togglePinned={() =>
                                                        updatePage(page.id, {
                                                            pinned: !page.pinned
                                                        }).then(() => {
                                                            removePageFromList(page.id);
                                                            this.setState({ page: null });
                                                        })
                                                    }
                                                    moveToDrafts={() =>
                                                        updatePage(page.id, {
                                                            status: "draft"
                                                        }).then(() => {
                                                            removePageFromList(page.id);
                                                            this.setState({ page: null });
                                                        })
                                                    }
                                                    moveToTrash={() =>
                                                        this.viewSwitcher.showView("moveToTrash")(
                                                            page
                                                        )
                                                    }
                                                    page={page}
                                                />
                                            </PageDetailsProvider>
                                        </Grid.Col>
                                    </Grid.Row>
                                </Fragment>
                            )}
                        </ViewSwitcher.View>
                        {/*<ViewSwitcher.View name={"unpublishPage"} modal>
                            {({ data }) => (
                                <Modal.Confirmation
                                    name={"unpublishConfirmation"}
                                    confirm={"Yes, unpublish this page!"}
                                    cancel={"I changed my mind"}
                                    message={
                                        <span>
                                            Are you sure you want to unpublish the page <br />
                                            <strong>{data.title}</strong>?
                                        </span>
                                    }
                                    onConfirm={() => toggleStatus(data.id)}
                                    onComplete={() => reloadPage(data.id)}
                                />
                            )}
                        </ViewSwitcher.View>*/}
                        <ViewSwitcher.View name={"moveToTrash"} modal>
                            {({ data }) => {
                                return (
                                    <Modal.Confirmation
                                        name={"moveToTrashConfirmation"}
                                        confirm={"Yes, move this page to trash!"}
                                        cancel={"Not now"}
                                        message={
                                            <span>
                                                Are you sure you want to move the page<br />
                                                <strong>{data.title}</strong>
                                                <br /> and all of its revisions to trash?
                                            </span>
                                        }
                                        onConfirm={() => moveToTrash(data.id)}
                                        onComplete={() => {
                                            removePageFromList(data.id);
                                            this.setState({ page: null });
                                        }}
                                    />
                                );
                            }}
                        </ViewSwitcher.View>
                    </ViewSwitcher>
                </View.Body>
            </View.List>
        );
    }
}

export default PageManager;
