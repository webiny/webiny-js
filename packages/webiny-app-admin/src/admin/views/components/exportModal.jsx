import React from "react";
import _ from "lodash";
import { i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.Modal.ExportModal");

class ExportModal extends Webiny.Ui.ModalComponent {
    constructor(props) {
        super(props);

        this.state = {
            content: "",
            loading: true
        };
    }

    componentWillMount() {
        const _fields = this.props.fields;
        const api = new Webiny.Api.Endpoint(this.props.api);
        return api.get(this.props.data.id, { _fields }).then(response => {
            let data = response.getData("entity");
            delete data.id;
            if (this.props.map) {
                data[this.props.map] = _.map(data[this.props.map], "slug");
            }

            this.setState({
                loading: false,
                content: JSON.stringify(data, null, 4)
            });
        });
    }

    render() {
        const { Modal, Copy, CodeHighlight, Loader, label } = this.props;
        return (
            <Modal.Dialog>
                <Modal.Content>
                    <Modal.Header title={this.i18n("Export {label}", { label })} />
                    <Modal.Body style={this.state.loading ? { height: 200 } : {}}>
                        {this.state.loading ? (
                            <Loader />
                        ) : (
                            <CodeHighlight language="json">{this.state.content}</CodeHighlight>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
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

ExportModal.defaultProps = _.assign({}, Webiny.Ui.ModalComponent.defaultProps, {
    api: "",
    data: {},
    map: "",
    label: "",
    fields: ""
});

export default createComponent(ExportModal, {
    modules: ["Modal", "Copy", "CodeHighlight", "Loader"]
});
