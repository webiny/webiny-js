import React from "react";
import { inject } from "webiny-client";
import styles from "./Header.scss?prefix=wby-cms-editor";

export default inject({ modules: ["Link", "Input", "ButtonGroup"] })(
    ({
        value,
        onChange,
        onSave,
        onCancel,
        onSettings,
        page,
        modules: { Link, Input, ButtonGroup }
    }) => {
        return (
            <header className={styles.header}>
                <div className={styles.layout}>
                    <div className={styles.title}>
                        <Input value={value} onChange={onChange} placeholder={"Page title"} />
                    </div>
                    <div className={styles.revision}>
                        Revision:<br />
                        <strong>{page.name}</strong> ({page.active ? `active` : `inactive`})
                    </div>
                    <div className={styles.actions}>
                        <ButtonGroup>
                            <Link type="primary" onClick={onSave}>
                                Save
                            </Link>
                            <Link type={"default"} onClick={onSettings}>
                                Settings
                            </Link>
                            <Link type={"default"} url={"/cms/preview/" + page.id} newTab>
                                Preview
                            </Link>
                            <Link type={"default"} onClick={onCancel}>
                                Cancel
                            </Link>
                        </ButtonGroup>
                    </div>
                </div>
            </header>
        );
    }
);
