import React from "react";
import { createComponent } from "webiny-app";
import styles from "./WidgetFunctions.scss";

class WidgetFunctions extends React.Component {
    render() {
        const {
            modules: { Icon, ClickConfirm },
            moveUp,
            moveDown,
            onRemoved,
            beforeRemove
        } = this.props;

        return (
            <div className={styles.widgetFunctions}>
                <a href="javascript:void(0)" className="editor-row-functions">
                    <Icon icon={["fas", "pencil-alt"]} />
                </a>
                <div className={styles.functions}>
                    <ul>
                        <li>
                            <a href="javascript:void(0)" onClick={moveUp}>
                                <Icon icon={["fas", "sort-up"]} />
                            </a>
                        </li>
                        <li>
                            <a href="javascript:void(0)">
                                <Icon icon={["fas", "cog"]} />
                            </a>
                        </li>
                        <li>
                            <ClickConfirm
                                message={"Are you sure you want to delete this widget?"}
                                onComplete={onRemoved}
                            >
                                {({ showConfirmation }) => (
                                    <a
                                        href="javascript:void(0)"
                                        onClick={() => showConfirmation(beforeRemove)}
                                    >
                                        <Icon icon={["fas", "times"]} />
                                    </a>
                                )}
                            </ClickConfirm>
                        </li>
                        <li>
                            <a href="javascript:void(0)" onClick={moveDown}>
                                <Icon icon={["fas", "sort-down"]} />
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        );
    }
}

export default createComponent(WidgetFunctions, { modules: ["Icon", "ClickConfirm"] });
