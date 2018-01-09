import React from 'react';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Ui.Settings
 */
class Settings extends Webiny.Ui.Component {

}

Settings.defaultProps = {
    api: '/entities/webiny/settings',
    onSuccessMessage: () => Webiny.I18n('Settings saved!'),
    onSubmitSuccess: null,
    renderer() {
        const {Form} = this.props;
        const formProps = {
            api: this.props.api,
            createHttpMethod: 'patch',
            onSuccessMessage: this.props.onSuccessMessage,
            onSubmitSuccess: this.props.onSubmitSuccess,
            children: this.props.children,
            loadModel({form}) {
                form.showLoading();
                return form.api.get('/').then(apiResponse => {
                    form.hideLoading();
                    if (apiResponse.isError()) {
                        Webiny.Growl.danger(apiResponse.getMessage(), Webiny.I18n('That didn\'t go as expected...'), true);
                        return form.handleApiError(apiResponse);
                    }
                    return apiResponse.getData();
                });
            }
        };

        return <Form {...formProps}/>;
    }
};

export default Webiny.createComponent(Settings, {modules: ['Form']});