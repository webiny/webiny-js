import React from "react";
import { Webiny } from "webiny-client";
import _ from "lodash";
import Container from "./Container";

class Wizard extends Webiny.Ui.Component {
    constructor() {
        super();
        this.container = null;
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { modules: { Form } } = this.props;

        return (
            <Form
                {...this.props.form}
                onSubmit={async params => {
                    // This callback won't be implemented by developers probably, because there are other valid Wizard callbacks.
                    const onSubmit = _.get(this.props.form, "onSubmit");
                    if (_.isFunction(onSubmit)) {
                        await this.props.form.onSubmit(params);
                    }

                    // We want to handle cases where user submits the form with keyboard, onSubmit gets triggered here.
                    const container = this.container.component;
                    if (container.isLastStep()) {
                        return container.finish();
                    }

                    return container.nextStep();
                }}
            >
                {({ form }) => (
                    <Container
                        ref={container => (this.container = container)}
                        form={form}
                        {..._.omit(this.props, ["Form", "form", "render", "children"])}
                    >
                        {this.props.children}
                    </Container>
                )}
            </Form>
        );
    }
}

Wizard.defaultProps = {
    contentRenderer: undefined,
    actionsRenderer: undefined,
    loaderRenderer: undefined,
    layoutRenderer: undefined,
    initialStep: 0,
    onTransition: _.noop,
    onFinish: _.noop,
    onStart: _.noop,
    form: {}
};

export default createComponent(Wizard, {
    modules: ["Form"]
});
