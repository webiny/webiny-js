import React from "react";
import _ from "lodash";
import { inject } from "webiny-app";
import filesize from "filesize";
import styles from "./styles.module.css";

@inject({ modules: ["Link"], styles })
class Image extends React.Component {
    constructor(props) {
        super(props);

        ["editImage", "deleteImage"].map(m => (this[m] = this[m].bind(this)));
    }

    editImage(e) {
        e.stopPropagation();
        this.props.onEdit();
    }

    deleteImage(e) {
        e.stopPropagation();
        this.props.onDelete();
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { modules: { Link }, image, styles } = this.props;
        const title = image.title || image.name || "";
        let cacheBust = "";
        if (image.modifiedOn && !image.data) {
            cacheBust = "?ts=" + new Date(image.modifiedOn).getTime();
        }

        const draggable = {
            "data-id": this.props.index,
            draggable: true,
            onDragStart: this.props.onDragStart,
            onDragEnd: this.props.onDragEnd,
            onDragOver: this.props.onDragOver
        };

        let editBtn = null;
        if (!_.has(image, "progress")) {
            editBtn = <Link onClick={this.editImage} className={styles.fileEdit} />;
        }

        return (
            <div className={styles.file} {...draggable} data-role="image">
                <img
                    className={styles.filePreview}
                    src={image.data || image.src + cacheBust}
                    alt={title}
                    title={title}
                    width="133"
                    height="133"
                />
                {editBtn}
                <Link onClick={this.deleteImage} className={styles.fileRemove} />
                <span className={styles.fileName}>{image.name}</span>
                <span className={styles.fileSize}>{image.id ? filesize(image.size) : "-"}</span>
            </div>
        );
    }
}

export default Image;
