import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import BaseCropper from './BaseCropper';

class InlineCropper extends BaseCropper {

}

InlineCropper.defaultProps = _.merge({}, BaseCropper.defaultProps, {
    renderer() {
        const props = this.props;
        if (!props.image) {
            return null;
        }

        const {Button} = props;

        return (
            <webiny-image-cropper>
                {props.children}
                <div className="col-xs-12 no-padding">
                    <img
                        id={this.id}
                        onLoad={this.initCropper}
                        width="100%"
                        style={{maxWidth: '100%'}}
                        src={props.image && props.image.src + this.getCacheBust()}/>
                    Cropped image size: <strong>{this.state.width}x{this.state.height}</strong>
                </div>
                <div className="col-xs-12">
                    <Button type="primary" className="pull-right ml5" onClick={this.applyCropping.bind(this)}>{this.props.action}</Button>
                    <Button type="default" className="pull-right ml5" onClick={this.props.onHidden}>Cancel</Button>
                </div>
            </webiny-image-cropper>
        );
    }
});

export default Webiny.createComponent(InlineCropper, {
    modules: ['Button', {Cropper: 'Webiny/Vendors/Cropper'}],
});