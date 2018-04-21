import React from "react";
import compose from "webiny-compose";
import _ from "lodash";
import { app } from "webiny-app";

import Widget from "./Widget";
import Settings from "./Settings";

function deleteImage(id) {
    const deleteImage = app.graphgl.generateDelete("Image");
    return deleteImage({ variables: { id } });
}

function handleImage(props, value, onChange) {
    const fields = "id src width height";

    const flow = [
        // Delete if image is removed
        ({ value, oldValue }, next, finish) => {
            if (!value) {
                if (oldValue.id) {
                    return deleteImage(oldValue.id).then(() => finish({ value: null }));
                }
            }
            next();
        },
        // Update if new image is selected
        ({ value, oldValue }, next, finish) => {
            if (value && oldValue) {
                const update = app.graphgl.generateUpdate("Image", fields);
                return update({ variables: { id: oldValue.id, data: value } }).then(({ data }) =>
                    finish({ value: data })
                );
            }
            next();
        },
        // Insert new image
        ({ value }, next, finish) => {
            const create = app.graphgl.generateCreate("Image", fields);
            create({ variables: { data: value } }).then(({ data }) => finish({ value: data }));
        }
    ];

    compose(flow)({ value, oldValue: _.get(props.value, "data.image") }).then(({ value }) =>
        onChange(value)
    );
}

export default {
    type: "image",
    title: "Image",
    icon: ["fas", "image"],
    removeWidget(widget) {
        if (widget.data.image) {
            return deleteImage(widget.data.image.id);
        }
    },
    renderWidget({ EditorWidget }) {
        return (
            <EditorWidget>
                <Widget handleImage={handleImage} />
            </EditorWidget>
        );
    },
    renderSettings() {
        return <Settings />;
    }
};
