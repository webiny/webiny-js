import React from "react";
import { createComponent } from "webiny-app";
import styles from "./WidgetFunctions.scss";

class WidgetFunctions extends React.Component {
    render() {
        const {
            modules: { Icon, ClickConfirm, Tooltip },
            moveUp,
            moveDown,
            onRemoved,
            beforeRemove,
            toggleScope,
            showSettings,
            widget
        } = this.props;

        const isGlobal = !!widget.origin;

        return (
            <div className={styles.widgetFunctions}>
                <a href="javascript:void(0)" className="editor-row-functions">
                    <Icon icon={["fas", "pencil-alt"]} />
                </a>
                <div className={styles.functions}>
                    <ul>
                        <li>
                            <Tooltip
                                target={
                                    <a href="javascript:void(0)" onClick={moveUp}>
                                        <Icon icon={["fas", "sort-up"]} />
                                    </a>
                                }
                            >
                                Move widget up
                            </Tooltip>
                        </li>
                        <li>
                            <Tooltip
                                target={
                                    <a href="javascript:void(0)" onClick={toggleScope}>
                                        <Icon icon={["fas", isGlobal ? "map-marker" : "globe"]} />
                                    </a>
                                }
                            >
                                {isGlobal ? "Make this widget local" : "Save to global widgets"}
                            </Tooltip>
                        </li>
                        <li>
                            <Tooltip
                                target={
                                    <a href="javascript:void(0)" onClick={showSettings}>
                                        <Icon icon={["fas", "cog"]} />
                                    </a>
                                }
                            >
                                Open widget settings
                            </Tooltip>
                        </li>
                        <li>
                            <ClickConfirm
                                message={"Are you sure you want to delete this widget?"}
                                onComplete={onRemoved}
                            >
                                {({ showConfirmation }) => (
                                    <Tooltip
                                        target={
                                            <a
                                                href="javascript:void(0)"
                                                onClick={() => showConfirmation(beforeRemove)}
                                            >
                                                <Icon icon={["fas", "times"]} />
                                            </a>
                                        }
                                    >
                                        Delete widget
                                    </Tooltip>
                                )}
                            </ClickConfirm>
                        </li>
                        <li>
                            <Tooltip
                                target={
                                    <a href="javascript:void(0)" onClick={moveDown}>
                                        <Icon icon={["fas", "sort-down"]} />
                                    </a>
                                }
                            >
                                Move widget down
                            </Tooltip>
                        </li>
                    </ul>
                </div>
            </div>
        );
    }
}

export default createComponent(WidgetFunctions, { modules: ["Icon", "ClickConfirm", "Tooltip"] });
