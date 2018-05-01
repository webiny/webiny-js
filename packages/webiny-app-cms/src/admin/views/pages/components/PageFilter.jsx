import React from "react";
import classSet from "classnames";
import _ from "lodash";
import { createComponent } from "webiny-app";
import styles from "./PageFilter.scss";

class PageFilter extends React.Component {
    constructor(props) {
        super();

        this.state = {
            search: props.query || "",
            focused: false
        };

        this.onKeyDown = this.onKeyDown.bind(this);
    }

    componentWillReceiveProps(props) {
        this.setState({ search: props.query || "" });
    }

    onKeyDown(event) {
        if (event.metaKey || event.ctrlKey) {
            return;
        }

        switch (event.key) {
            case "Enter":
                event.preventDefault();
                this.props.setSearchQuery(event.target.value);
                break;
            default:
                break;
        }
    }

    render() {
        const { Icon } = this.props.modules;

        return (
            <div className={styles["filter-bar"]}>
                <div
                    onClick={() => {
                        this.setState({ focused: true });
                        this.search.focus();
                    }}
                    className={classSet(styles["filter-bar__search"], {
                        [styles["has-search"]]: !_.isEmpty(this.props.query) || this.state.focused
                    })}
                >
                    <label htmlFor={"search"}>
                        <Icon icon={["fa", "search"]} size={"2x"} />
                    </label>
                    <div className={styles.inputContainer}>
                        <input
                            onBlur={() => this.setState({ focused: false })}
                            ref={ref => (this.search = ref)}
                            id="search"
                            type="text"
                            placeholder="SEARCH"
                            value={this.state.search}
                            onKeyDown={this.onKeyDown}
                            onChange={e => this.setState({ search: e.target.value }, () => {})}
                        />
                    </div>
                </div>
                <div className={styles["filter-bar__items"]}>
                    <a className={styles["filter-bar__item"]} href="#">
                        All <span>(14)</span>
                    </a>
                    <a className={styles["filter-bar__item"]} href="#">
                        Published <span>(8)</span>
                    </a>
                    <a className={styles["filter-bar__item"]} href="#">
                        Drafts <span>(2)</span>
                    </a>
                    <a className={styles["filter-bar__item"]} href="#">
                        Pinned <span>(2)</span>
                    </a>
                    <a className={styles["filter-bar__item"]} href="#">
                        Trash <span>(2)</span>
                    </a>
                </div>
            </div>
        );
    }
}

export default createComponent(PageFilter, { modules: ["Icon"] });
