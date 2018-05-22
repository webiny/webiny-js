import React from "react";
import compose from "webiny-compose";
import _ from "lodash";
import { app } from "webiny-app";
import { EditorWidget } from "webiny-app-cms";

import ImageWidgetCmp from "./Widget";
import ImageWidgetSettingsCmp from "./Settings";

class ImageWidget extends EditorWidget {
    removeWidget({ widget }) {
        if (widget.data.image) {
            return this.deleteImage(widget.data.image.id);
        }
    }

    renderWidget({ WidgetContainer }) {
        return (
            <WidgetContainer>
                <ImageWidgetCmp handleImage={this.handleImage.bind(this)} />z
            </WidgetContainer>
        );
    }

    renderSettings({ WidgetSettingsContainer }) {
        return (
            <WidgetSettingContainers>
                <ImageWidgetSettingsCmp />
            </WidgetSettingContainers>
        );
    }

    /**
     * @private
     * @param id
     * @returns {*}
     */
    deleteImage(id) {
        const deleteImage = app.graphql.generateDelete("Image");
        return deleteImage({ variables: { id } });
    }

    /**
     * @private
     * @param props
     * @param value
     * @param onChange
     */
    handleImage(props, value, onChange) {
        const fields = "id src width height";

        const flow = [
            // Delete if image is removed
            ({ value, oldValue }, next, finish) => {
                if (!value) {
                    if (oldValue.id) {
                        return this.deleteImage(oldValue.id).then(() => finish({ value: null }));
                    }
                }
                next();
            },
            // Update if new image is selected
            ({ value, oldValue }, next, finish) => {
                if (value && oldValue) {
                    const update = app.graphql.generateUpdate("Image", fields);
                    return update({ variables: { id: oldValue.id, data: value } }).then(
                        ({ data }) => finish({ value: data })
                    );
                }
                next();
            },
            // Insert new image
            ({ value }, next, finish) => {
                const create = app.graphql.generateCreate("Image", fields);
                create({ variables: { data: value } }).then(({ data }) => finish({ value: data }));
            }
        ];

        compose(flow)({ value, oldValue: _.get(props.widget, "data.image") }).then(({ value }) =>
            onChange(value)
        );
    }
}

export default ImageWidget;
