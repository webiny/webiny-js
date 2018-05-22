import React from "react";
import classSet from "classnames";
import _ from "lodash";
import { createComponent } from "webiny-app";
import styles from "./PageFilter.scss?prefix=Webiny_CMS_PageFilter";

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
        const { modules: { Link, Icon }, setFilter } = this.props;

        const filter = _.get(this.props.filter, "filter", "all");

        const activeItem = "filter-bar__item--active";

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
                    <Link
                        className={classSet(styles["filter-bar__item"], {
                            [styles[activeItem]]: filter === "all"
                        })}
                        onClick={() => setFilter({ filter: "all" })}
                    >
                        All <span />
                    </Link>
                    <Link
                        className={classSet(styles["filter-bar__item"], {
                            [styles[activeItem]]: filter === "published"
                        })}
                        onClick={() => setFilter({ filter: "published" })}
                    >
                        Published <span />
                    </Link>
                    <Link
                        className={classSet(styles["filter-bar__item"], {
                            [styles[activeItem]]: filter === "draft"
                        })}
                        onClick={() => setFilter({ filter: "draft" })}
                    >
                        Drafts <span />
                    </Link>
                    <Link
                        className={classSet(styles["filter-bar__item"], {
                            [styles[activeItem]]: filter === "pinned"
                        })}
                        onClick={() => setFilter({ filter: "pinned" })}
                    >
                        Pinned <span />
                    </Link>
                    <Link
                        className={classSet(styles["filter-bar__item"], {
                            [styles[activeItem]]: filter === "trash"
                        })}
                        onClick={() => setFilter({ filter: "trash" })}
                    >
                        Trash <span />
                    </Link>
                </div>
            </div>
        );
    }
}

export default createComponent(PageFilter, { modules: ["Icon", "Link"] });
