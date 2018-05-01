import React from 'react';
import { createComponent } from 'webiny-app';
import styles from './styles.css?prefix=Webiny_Ui_Image';

class ImagePreview extends React.Component {

    constructor(props) {
        super(props);

        ['editImage', 'deleteImage'].map(m => this[m] = this[m].bind(this));
    }

    editImage(e) {
        e.stopPropagation();
        this.props.onEdit();
    }

    deleteImage(e) {
        e.stopPropagation();
        this.props.onDelete(e);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { image, modules: { Link }, styles } = this.props;
        let cacheBust = '';
        if (image.modifiedOn && !image.data) {
            cacheBust = '?ts=' + new Date(image.modifiedOn).getTime();
        }

        return (
            <div className={styles.file} style={{ float: 'none' }}>
                <img className={styles.filePreview} src={image.data || image.src + cacheBust} style={{ width: '100%' }}/>
                {this.props.onEdit ? <Link onClick={this.editImage} className={styles.fileEdit}/> : null}
                <Link onClick={this.deleteImage} className={styles.fileRemove}/>
            </div>
        );
    }
}

export default createComponent(ImagePreview, { modules: ['Link'], styles });