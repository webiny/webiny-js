import React from "react";
import { i18n } from "webiny-client";
import styles from "./PageList.module.scss";

const t = i18n.namespace("Cms.Admin.Views.PageList");

const PageList = ({ pages, onPageClick}) => {
    return (
        <ul className={styles.list}>
            {pages.map(page => {
                const key = page.id + '-' + page.savedOn;
                return (
                    <li className={styles.item} key={key} onClick={() => onPageClick(page)}>
                        <div className={styles.header}>
                            <div>
                                {t`{created|dateTime}`({
                                    created: page.createdOn
                                })}
                            </div>
                            <div>{page.category.title}</div>
                            <div>
                                By: {page.createdBy.firstName} {page.createdBy.lastName}
                            </div>
                        </div>
                        <div className={styles.body}>
                            <div className={styles.title}>{page.title}</div>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

export default PageList;
