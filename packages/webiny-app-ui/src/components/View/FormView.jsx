import React from "react";
import _ from "lodash";
import { isElementOfType, createComponent } from "webiny-app";
import Header from "./Header";
import Body from "./Body";
import Footer from "./Footer";
import styles from "./styles.css";

class FormView extends React.Component {
    constructor(props) {
        super(props);

        this.parseLayout = this.parseLayout.bind(this);
    }

    parseLayout(children) {
        if (!this.props.form) {
            console.error("<View.Form> must be a child of a Form element!");
            return;
        }

        this.headerComponent = null;
        this.bodyComponent = null;
        this.footerComponent = null;
        this.errorComponent = null;

        if (typeof children !== "object" || children === null) {
            return children;
        }

        const { Form } = this.props;
        // Loop through View elements and detect header/body/footer components
        React.Children.map(children, child => {
            if (isElementOfType(child, Header)) {
                this.headerComponent = child;
                return;
            }

            if (isElementOfType(child, Body)) {
                // Check if form loader exists in body
                let loader = null;
                React.Children.map(child.props.children, bodyChild => {
                    if (isElementOfType(bodyChild, Form.Loader)) {
                        loader = true;
                    }
                });

                if (loader) {
                    // We have our body element
                    this.bodyComponent = child;
                } else {
                    // We need to create form loader ourselves
                    const bodyChildren = React.Children.toArray(child.props.children);
                    bodyChildren.push(
                        <Form.Loader key="loader" show={this.props.form.isLoading()} />
                    );
                    this.bodyComponent = React.cloneElement(child, child.props, bodyChildren);
                }
                return;
            }

            if (isElementOfType(child, Footer)) {
                this.footerComponent = child;
                return;
            }

            if (isElementOfType(child, Form.Error)) {
                this.errorComponent = React.cloneElement(
                    child,
                    _.merge(child.props, { error: this.props.form.getError() })
                );
            }
        });

        if (!this.errorComponent) {
            this.errorComponent = <Form.Error error={this.props.form.getError()} />;
        }
    }

    componentWillMount() {
        this.parseLayout(this.props.children);
    }

    componentWillUpdate(nextProps) {
        this.parseLayout(nextProps.children);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { Panel, styles } = this.props;
        return (
            <div>
                {this.headerComponent}
                <div className={styles.viewContent} style={this.bodyComponent.props.style}>
                    {this.errorComponent}
                    <Panel className={styles.panel}>
                        {this.bodyComponent}
                        {this.footerComponent}
                    </Panel>
                </div>
            </div>
        );
    }
}

FormView.defaultProps = {
    formInject: true
};

export default createComponent(FormView, { modules: ["Panel", "Form"], styles });
