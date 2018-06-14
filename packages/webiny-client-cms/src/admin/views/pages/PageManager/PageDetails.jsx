import React, { Fragment } from "react";
import _ from "lodash";
import { i18n, inject } from "webiny-client";
import PageContentPreview from "./PageContentPreview";
import PageRevisions from "./PageRevisions";
import styles from "./PageDetails.scss";
import blankState from "./assets/blank-state-preview.svg";

const t = i18n.namespace("Cms.Admin.Views.PageDetails");

@inject({
    modules: ["Tabs", "Select", "Icon", "Link", "Dropdown"]
})
class PageDetails extends React.Component {
    constructor() {
        super();

        this.state = {
            revisions: [],
            revision: null
        };

        this.prepare = this.prepare.bind(this);
    }

    componentWillMount() {
        this.prepare(this.props);
    }

    componentWillReceiveProps(props) {
        if (_.get(props.page, "id") !== _.get(this.props, "page.id")) {
            this.prepare(props);
        }
    }

    prepare(props) {
        props.page &&
            this.setState(() => {
                const revision = _.find(props.page.revisions, { active: true });

                return {
                    revision: { ...revision },
                    revisions: props.page.revisions.map(data => ({
                        value: data.id,
                        label: data.name,
                        data
                    }))
                };
            });
    }

    render() {
        const {
            page,
            moveToTrash,
            moveToDrafts,
            togglePinned,
            togglePublished,
            modules: { Tabs, Select, Icon, Link, Dropdown }
        } = this.props;

        if (!page) {
            return (
                <div className={styles.emptyPlaceholder}>
                    <div className={styles.emptyContent}>
                        <img src={blankState} alt="" />
                        <h3>So, this is a preview pane.</h3>
                        <p>
                            Lets make it do it’s job.<br />Just click on the article on the left and
                            see your article and revisions.
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <Fragment>
                <div className={styles.actions}>
                    <Link route={"Cms.Page.Editor"} params={{ id: this.state.revision.id }}>
                        <Icon icon={"edit"} />
                    </Link>
                    <Link onClick={page.status !== "trash" ? moveToTrash : moveToDrafts}>
                        <Icon icon={page.status !== "trash" ? "trash-alt" : "undo"} />
                    </Link>
                    {page.status !== "trash" && (
                        <Link onClick={togglePublished}>
                            <Icon icon={page.status === "published" ? "eye-slash" : "eye"} />
                        </Link>
                    )}
                    {page.status !== "trash" && (
                        <Link onClick={togglePinned} className={page.pinned ? styles.pinned : null}>
                            <Icon icon={"thumbtack"} />
                        </Link>
                    )}
                </div>
                <Tabs size="large">
                    <Tabs.Tab label="Preview page">
                        <div className={styles.preview}>
                            <div className={styles.previewDetails}>
                                <div>
                                    Date created:{" "}
                                    {t`{created|dateTime}`({
                                        created: page.createdOn
                                    })}
                                </div>
                                <div>Category: {page.category.title}</div>
                                <div>
                                    By: {page.createdBy.firstName} {page.createdBy.lastName}
                                </div>
                                <div>Status: {page.status}</div>
                            </div>
                            <div className={styles.previewRevision}>
                                {this.state.revision && (
                                    <Select
                                        useDataAsValue
                                        value={this.state.revision.id}
                                        onChange={revision => {
                                            revision && this.setState({ revision });
                                        }}
                                        options={_.cloneDeep(this.state.revisions)}
                                    />
                                )}
                            </div>
                            {this.state.revision && (
                                <PageContentPreview
                                    content={this.state.revision.content}
                                    styles={styles}
                                />
                            )}
                        </div>
                    </Tabs.Tab>
                    <Tabs.Tab label="Revisions">
                        <PageRevisions revisions={page.revisions} modules={{ Icon, Dropdown }} />
                    </Tabs.Tab>
                </Tabs>
            </Fragment>
        );
    }
}

export default PageDetails;
