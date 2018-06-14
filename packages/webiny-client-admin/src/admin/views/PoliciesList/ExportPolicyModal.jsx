import React from "react";
import _ from "lodash";

import { i18n, Component, app } from "webiny-client";
const t = i18n.namespace("Security.Modal.ExportPolicyModal");
import { withModalDialog } from "webiny-client-ui";
import css from "./exportPolicyModal.scss";

@withModalDialog()
@Component({
    modules: ["Modal", "Copy", "CodeHighlight", "Loader", "Button"]
})
class ExportPolicyModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            content: "",
            loading: true
        };
    }

    componentWillMount() {
        const getPolicy = app.graphql.generateGet(
            "SecurityPolicy",
            "id name slug description permissions"
        );
        getPolicy({ variables: { id: this.props.data.id } }).then(({ data }) => {
            const content = _.pick(data, ["name", "slug", "description", "permissions"]);
            this.setState({ loading: false, content: JSON.stringify(content, null, 2) });
        });
    }

    render() {
        const { Modal, Copy, CodeHighlight, Loader, Button } = this.props.modules;

        return (
            <Modal.Dialog>
                <Modal.Content className={css.exportPolicyModal}>
                    <Modal.Header
                        title={t`Export {label}`({ label: this.props.data.name })}
                        onClose={this.props.hide}
                    />

                    <Modal.Body style={this.state.loading ? { height: 200 } : {}}>
                        {this.state.loading ? (
                            <Loader />
                        ) : (
                            <div>
                                <CodeHighlight language="json">{this.state.content}</CodeHighlight>
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button type="default" label="Cancel" onClick={this.props.hide} />
                        <Copy.Button
                            label={t`Copy`}
                            type="primary"
                            value={this.state.content}
                            renderIf={this.state.content}
                        />
                    </Modal.Footer>
                </Modal.Content>
            </Modal.Dialog>
        );
    }
}

ExportPolicyModal.defaultProps = {
    api: "",
    data: {},
    map: "",
    label: "",
    fields: ""
};

export default ExportPolicyModal;
