import React from "react";
import ReactDOM from "react-dom";
import classSet from "classnames";
import { inject } from "webiny-client";
import styles from "./AddWidget.scss?prefix=wby-cms-editor-addWidget";

@inject({ modules: ["Icon", "Input"], services: ["cms"] })
class AddWidget extends React.Component {
    state = {
        search: ""
    };

    renderWidget = ({ type, widget }) => {
        const {
            modules: { Icon }
        } = this.props;

        return (
            <div
                key={type}
                className={styles.widget}
                onClick={() => this.props.onAdd({ type, widget })}
            >
                <img src={widget.options.image} width={"100%"} />
                <div className={styles.description}>
                    <h3>{widget.options.title}</h3>
                    <p>{widget.options.description}</p>
                </div>
                <div className={styles.overlay} />
                <div className={styles.insert}>
                    <span>Insert widget</span>
                    <div className={styles.icon}>
                        <Icon icon={"plus-circle"} size={"5x"} />
                    </div>
                </div>
            </div>
        );
    };

    render() {
        const {
            show,
            modules: { Input },
            services: { cms }
        } = this.props;

        return ReactDOM.createPortal(
            <React.Fragment>
                <div className={classSet(styles.container, show && styles.show)}>
                    <Input
                        delay={200}
                        autoFocus={show}
                        placeholder={"Search widgets..."}
                        value={this.state.search}
                        onChange={search => this.setState({ search })}
                    />
                    {cms.findEditorWidgets(this.state.search).map(group => (
                        <div className={styles.group} key={group.name}>
                            <h2>{group.title}</h2>
                            {group.widgets.map(this.renderWidget)}
                        </div>
                    ))}
                </div>
                <div className={classSet(styles.backdrop, show && styles.show)} />
            </React.Fragment>,
            document.getElementById("wby-cms-editor-portal")
        );
    }
}

export default AddWidget;
