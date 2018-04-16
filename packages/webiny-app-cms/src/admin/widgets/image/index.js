import React from "react";
import { operationGenerator } from "webiny-data-ui";
import compose from "webiny-compose";
import _ from "lodash";

import Widget from "./widget";
import Settings from "./settings";

function deleteImage(id) {
    const deleteImage = operationGenerator.generateDelete("Image");
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
                const update = operationGenerator.generateUpdate("Image", fields);
                return update({ variables: { id: oldValue.id, data: value } }).then(({ data }) =>
                    finish({ value: data })
                );
            }
            next();
        },
        // Insert new image
        ({ value }, next, finish) => {
            const create = operationGenerator.generateCreate("Image", fields);
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
        return Promise.resolve();
    },
    renderWidget() {
        return <Widget handleImage={handleImage} />;
    },
    renderSettings() {
        return <Settings />;
    }
};
