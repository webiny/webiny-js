import React from "react";
import { inject } from "webiny-client";
import styles from "./Header.scss?prefix=wby-cms-editor";

export default inject({ modules: ["Link", "Input"] })(
    ({ onSave, page, Bind, modules: { Link, Input } }) => {
        return (
            <header className={styles.header}>
                <div className={styles.layout}>
                    <div className={styles.title}>
                        <Bind name={"title"}>
                            <Input placeholder={"Page title"} />
                        </Bind>
                    </div>
                    <div className={styles.revision}>
                        Revision:<br />
                        <strong>{page.name}</strong> ({page.active ? `active` : `inactive`})
                    </div>
                    <div className={styles.actions}>
                        <Link type="primary" align="right" onClick={onSave}>
                            Save page
                        </Link>
                        <Link type="secondary" align="right" url={"/cms/preview/" + page.id} newTab>
                            Preview
                        </Link>
                    </div>
                </div>
            </header>
        );
    }
);