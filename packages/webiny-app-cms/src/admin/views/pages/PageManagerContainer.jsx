import React from "react";
import _ from "lodash";
import { app, createComponent } from "webiny-app";
import PageManager from "./PageManager";
import { PageManagerProvider } from "./context/PageManagerContext";

const createdBy = "createdBy { ... on SecurityUser { firstName lastName } }";
const fields = `
    id title slug status createdOn
    category { title }
    revisions { id name slug title active content { id type origin data settings } savedOn createdOn ${createdBy}}
    ${createdBy}
`;

class PageManagerContainer extends React.Component {
    constructor() {
        super();
        this.state = {};
        this.currentList = [];
        this.lastLoadedPage = 0;
        this.reloadPage = this.reloadPage.bind(this);
        this.deletePage = this.deletePage.bind(this);
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

    deletePage(id) {
        return app.graphql.generateDelete("CmsPage")({ variables: { id } });
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
                sort={{savedOn: -1}}
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
                        reloadPage: this.reloadPage,
                        deletePage: this.deletePage
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
                                    "deletePage"
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

export default createComponent(PageManagerContainer, { modules: ["ListData"] });
