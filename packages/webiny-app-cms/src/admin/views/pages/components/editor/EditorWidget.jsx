import React from "react";
import _ from "lodash";
import { app, createComponent } from "webiny-app";

class EditorWidget extends React.Component {
    constructor(props) {
        super();

        this.state = {
            showGlobalControls: false
        };

        this.cms = props.services.cms;

        this.onChange = this.onChange.bind(this);
        this.applyChanges = this.applyChanges.bind(this);
    }

    componentWillReceiveProps(props) {
        if (!props.value.origin) {
            this.setState({ showGlobalControls: false });
        }
    }

    onChange(model) {
        if (this.props.isGlobal) {
            if (!_.isEqual(this.props.value.data, model)) {
                this.setState({ showGlobalControls: true });
            }

            return;
        }

        this.props.onChange(model);
    }

    applyChanges(data) {
        this.cms.updateGlobalWidget(this.props.value.origin, { data }).then(() => {
            this.setState({ showGlobalControls: false }, () => this.props.onChange(data));
        });
    }

    render() {
        const { modules: { Form, Link, Icon }, value, onChange, children, ...props } = this.props;
        return (
            <Form model={value.data} onChange={this.onChange}>
                {({ model, Bind }) => (
                    <React.Fragment>
                        {React.cloneElement(children, { Bind, value, onChange, ...props })}
                        {this.state.showGlobalControls && (
                            <div style={{ marginTop: 5 }}>
                                Note: changes on global widgets must be applied explicitly.
                                <br />
                                <Link onClick={() => this.applyChanges(model)}>
                                    <Icon icon={"save"} /> Apply changes
                                </Link>
                            </div>
                        )}
                    </React.Fragment>
                )}
            </Form>
        );
    }
}

export default createComponent(EditorWidget, {
    modules: ["Form", "Link", "Icon"],
    services: ["cms"]
});
