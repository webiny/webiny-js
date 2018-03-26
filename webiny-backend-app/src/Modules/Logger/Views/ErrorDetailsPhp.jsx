import React from 'react';
import {Webiny} from 'webiny-client';

class ErrorDetailsPhp extends Webiny.Ui.View {

}

ErrorDetailsPhp.defaultProps = {

    renderer() {
        const statProps = {
            api: '/entities/webiny/logger-entry',
            url: this.props.errorEntry.id,
            fields: 'id,stack',
            prepareLoadedData: ({data}) => data.entity
        };

        return (
            <Webiny.Ui.LazyLoad modules={['Data', 'Grid', 'CodeHighlight']}>
                {(Ui) => (
                    <Ui.Data {...statProps}>
                        {({data}) => (
                            <Ui.Grid.Row>
                                <Ui.Grid.Col all={12}>
                                    <Ui.CodeHighlight language="php">
                                        {data.stack}
                                    </Ui.CodeHighlight>
                                </Ui.Grid.Col>
                            </Ui.Grid.Row>
                        )}
                    </Ui.Data>
                )}
            </Webiny.Ui.LazyLoad>
        );
    }
};

export default ErrorDetailsPhp;