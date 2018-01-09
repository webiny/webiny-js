import React from 'react';
import {Webiny} from 'webiny-client';

class Dashboard extends Webiny.Ui.View {
    render() {
        const {View} = this.props;
        const user = Webiny.Model.get('User');

        return (
            <View.Dashboard>
                <View.Header
                    title="My Dashboard"
                    description="Here you will find latest information about your account.">
                </View.Header>
                <View.Body>
                    <p>You can now begin developing your app :)</p>
                </View.Body>
            </View.Dashboard>
        );
    }
}

// This will create a component class and lazy load the defined modules
// when this view is about to be mounted.
export default Webiny.createComponent(Dashboard, {modules: ['View']});