import React from 'react';
import {Webiny} from 'webiny-client';

class CustomViews extends Webiny.Ui.Component {
    shouldComponentUpdate(nextProps) {
        return nextProps.preview !== this.props.preview;
    }
}

CustomViews.defaultProps = {
    renderer() {
        const views = this.props.plugins.getCustomViews().map((view, i) => {
            return <div className="custom-view" key={(this.props.preview ? 'prev-' : 'edit-') + i}>{view}</div>;
        });

        return (
            <custom-views>{views}</custom-views>
        );
    }
};

export default CustomViews;