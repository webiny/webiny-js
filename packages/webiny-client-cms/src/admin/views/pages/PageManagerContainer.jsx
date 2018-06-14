import React from "react";
import _ from "lodash";
import { app, inject } from "webiny-client";
import PageManager from "./PageManager/PageManager";
import { PageManagerProvider } from "./PageManager/PageManagerContext";

const createdBy = "createdBy { ... on SecurityUser { firstName lastName } }";
const fields = `
    id title slug status createdOn pinned
    category { title }
    revisions { id name slug title active content { id type data } savedOn createdOn ${createdBy}}
    ${createdBy}
`;

@inject({ modules: ["ListData"] })
class PageManagerContainer extends React.Component {
    constructor() {
        super();
        this.state = {};
        this.currentList = [];
        this.lastLoadedPage = 0;
        this.updatePage = this.updatePage.bind(this);
        this.reloadPage = this.reloadPage.bind(this);
        this.moveToTrash = this.moveToTrash.bind(this);
        this.removePageFromList = this.removePageFromList.bind(this);
    }

    updateRevision(id, data) {
        const updateRevision = app.graphql.generateUpdate("CmsRevision", "id");

        return updateRevision({ variables: { id, data } }).catch(error => {
            app.services.get("growler").warning(error.message);
        });
    }

    reloadPage(id) {
        const getPage = app.graphql.generateGet("CmsPage", fields);

        return getPage({ variables: { id } }).then(({ data }) => {
            const index = _.findIndex(this.currentList, { id });
            this.currentList.splice(index, 1, data);
            this.setState({ ts: Date.now() });
        });
    }

    moveToTrash(id) {
        return this.updatePage(id, { status: "trash" });
    }

    updatePage(id, data) {
        return app.graphql
            .generateUpdate("CmsPage", fields)({ variables: { id, data } })
            .then(({ data }) => {
                const index = _.findIndex(this.currentList, { id });
                this.currentList.splice(index, 1, data);
                this.setState({ ts: Date.now() });
            });
    }

    removePageFromList(id) {
        const index = _.findIndex(this.currentList, { id });
        this.currentList.splice(index, 1);
        this.setState({ ts: Date.now() });
    }

    combineList(list) {
        this.currentList = _.uniq([...this.currentList, ...list]);

        return this.currentList;
    }

    render() {
        const { modules: { ListData } } = this.props;
        return (
            <ListData
                entity={"CmsPage"}
                search={{ fields: ["title", "slug"] }}
                sort={{ savedOn: -1 }}
                perPage={7}
                fields={fields}
            >
                {props => {
                    let { list, meta, page } = props;
                    if (!props.loading) {
                        if (page > this.lastLoadedPage) {
                            list = this.combineList(list);
                            this.lastLoadedPage = page;
                        } else {
                            list = this.currentList;
                        }
                    }

                    const context = {
                        ...props,
                        list,
                        hasMore: meta.totalPages > page,
                        loadMore: () => props.setPage(page + 1),
                        updateRevision: this.updateRevision,
                        updatePage: this.updatePage,
                        reloadPage: this.reloadPage,
                        moveToTrash: this.moveToTrash
                    };

                    return (
                        <PageManagerProvider value={context}>
                            <PageManager
                                {..._.pick(context, [
                                    "list",
                                    "meta",
                                    "page",
                                    "filter",
                                    "setSearchQuery",
                                    "search",
                                    "hasMore",
                                    "loadMore",
                                    "moveToTrash",
                                    "updatePage"
                                ])}
                                setSearchQuery={query => {
                                    this.lastLoadedPage = 0;
                                    this.currentList = [];
                                    context.setSearchQuery(query);
                                }}
                                setFilter={filter => {
                                    this.lastLoadedPage = 0;
                                    this.currentList = [];
                                    context.setFilter(filter);
                                }}
                                removePageFromList={this.removePageFromList}
                            />
                        </PageManagerProvider>
                    );
                }}
            </ListData>
        );
    }
}

export default PageManagerContainer;
