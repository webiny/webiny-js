import React, { Fragment } from "react";
import _ from "lodash";
import { app, i18n } from "webiny-app";
import CreateRevisionDialog from "./CreateRevisionDialog";
import { PageDetailsConsumer } from "./../PageManager/PageDetailsContext";
import styles from "./PageRevisions.scss?prefix=Webiny_CMS_PageRevisions";

const t = i18n.namespace("Cms.Admin.Views.PageRevisions");

const RevisionActions = ({ revision, modules: { Icon, Dropdown } }) => {
    return (
        <PageDetailsConsumer>
            {({ updateRevision, reloadPage, page }) => (
                <div className={styles.actions}>
                    <Dropdown
                        title={<Icon className={styles.cog} icon={"cog"} />}
                        type={"balloon"}
                        caret={false}
                        align={"right"}
                    >
                        <Dropdown.Header title="Actions" />
                        {!revision.active && (
                            <Dropdown.Link
                                key={"activate"}
                                title={"Activate"}
                                onClick={() =>
                                    updateRevision(revision.id, { active: true }).then(() =>
                                        reloadPage(page.id)
                                    )
                                }
                            />
                        )}
                        <Dropdown.Link
                            key={"edit"}
                            title={"Edit"}
                            route={"Cms.Page.Editor"}
                            params={{ id: revision.id }}
                        />
                        <Dropdown.Link
                            key={"create"}
                            title={"Create new"}
                            onClick={() => {
                                app.services
                                    .get("modal")
                                    .show("createRevision", { source: revision });
                            }}
                        />
                    </Dropdown>
                </div>
            )}
        </PageDetailsConsumer>
    );
};

const ActiveRevision = props => {
    const { revision: { name, title, createdOn, savedOn, createdBy }, modules: { Icon } } = props;

    return (
        <li className={styles.activeRevision}>
            <span className={styles.badge}>
                <Icon icon={"check"} /> Active
            </span>
            <div className={styles.textWrap}>
                <span className={styles.date}>Name: {name}</span>
                <h2>{title}</h2>
                <span className={styles.date}>
                    Created:{" "}
                    {t`{date|dateTime}`({
                        date: createdOn
                    })}
                </span>
                <span className={styles.date}>
                    Last edited:{" "}
                    {t`{date|dateTime}`({
                        date: savedOn
                    })}
                </span>
                <span className={styles.date}>
                    By: {createdBy.firstName} {createdBy.lastName}
                </span>
            </div>
            <RevisionActions {...props} />
        </li>
    );
};

const Revision = props => {
    const { revision: { id, name, title, savedOn, createdBy } } = props;

    return (
        <li className={styles.revision} key={id + "-" + savedOn}>
            <div className={styles.textWrap}>
                <span className={styles.revisionDate}>Name: {name}</span>
                <h3>{title}</h3>
                <span className={styles.revisionDate}>
                    Last edited:{" "}
                    {t`{date|dateTime}`({
                        date: savedOn
                    })}
                </span>
                <span className={styles.revisionDate}>
                    By: {createdBy.firstName} {createdBy.lastName}
                </span>
            </div>
            <RevisionActions {...props} />
        </li>
    );
};

const PageRevisions = ({ modules }) => {
    return (
        <PageDetailsConsumer>
            {({ page }) => (
                <Fragment>
                    <CreateRevisionDialog page={page} name={"createRevision"} />
                    <ul className={styles.revisions}>
                        <ActiveRevision
                            modules={modules}
                            revision={_.find(page.revisions, { active: true })}
                        />
                        {page.revisions
                            .filter(r => !r.active)
                            .map(rev => (
                                <Revision
                                    revision={rev}
                                    key={rev.id + "-" + rev.savedOn}
                                    modules={modules}
                                />
                            ))}
                    </ul>
                </Fragment>
            )}
        </PageDetailsConsumer>
    );
};

export default PageRevisions;
