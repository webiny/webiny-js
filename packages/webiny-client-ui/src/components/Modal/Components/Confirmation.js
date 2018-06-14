import React from "react";
import _ from "lodash";
import { Component, i18n } from "webiny-client";
import withModalConfirmation from "../withModalConfirmation";
import Dialog from "./Dialog";
import Content from "./Content";
import Body from "./Body";
import Footer from "./Footer";

const t = i18n.namespace("Webiny.Ui.Modal.Confirmation");

@withModalConfirmation()
@Component({
    modules: ["Button", "Loader"]
})
class Confirmation extends React.Component {
    render() {
        const {
            modules: { Loader, Button },
            styles,
            title,
            render
        } = this.props;
        if (render) {
            return render.call(this);
        }

        let content = this.props.message || this.props.children;
        if (_.isFunction(content)) {
            content = content({ data: this.props.data });
        }

        return (
            <Dialog
                modalContainerTag="confirmation-modal"
                className={styles.alertModal}
                onCancel={this.props.onCancel}
                closeOnClick={this.props.closeOnClick}
            >
                {this.props.loading && <Loader />}
                <Content>
                    <Body>
                        <div className="text-center">
                            <h4>{title}</h4>

                            <p>{content}</p>
                        </div>
                    </Body>
                    <Footer>
                        <Button
                            type="default"
                            label={this.props.cancel}
                            onClick={this.props.onCancel}
                        />
                        <Button
                            type="primary"
                            label={this.props.confirm}
                            onClick={this.props.onConfirm}
                        />
                    </Footer>
                </Content>
            </Dialog>
        );
    }
}

Confirmation.defaultProps = {
    title: t`Confirmation dialog`,
    confirm: t`Yes`,
    cancel: t`No`
};

export default Confirmation;
