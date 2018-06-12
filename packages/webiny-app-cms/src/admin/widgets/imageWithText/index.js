import React from "react";
import compose from "webiny-compose";
import _ from "lodash";
import { app } from "webiny-app";
import EditorWidget from "../../utils/EditorWidget";

import Widget from "./Widget";
import Settings from "./Settings";
import widgetImage from "./image-with-text.png";

class ImageWithText extends EditorWidget {
    options = {
        title: "Image with text",
        description: "Image on one side with a paragraph of text on another. ",
        image: widgetImage,
        data: {
            text:
                "Nullam molestie, tortor id rhoncus scelerisque, ex justo tincidunt nisl, non dignissim justo urna ac ex. Etiam a ultrices justo. Pellentesque habitant morbi tristique senectus et netus et malesuada fames.",
            image: null,
            imagePosition: "left",
            imageSize: 50,
            padding: 15
        }
    };

    removeWidget({ widget }) {
        if (widget.data.image) {
            return this.deleteImage(widget.data.image.id);
        }
    }

    renderWidget({ WidgetContainer }) {
        return (
            <WidgetContainer>
                {({ widgetProps }) => (
                    <Widget {...widgetProps} handleImage={this.handleImage.bind(this)} />
                )}
            </WidgetContainer>
        );
    }

    renderSettings({ WidgetSettingsContainer }) {
        return (
            <WidgetSettingsContainer>
                {({ settingsGroup, styleGroup, widgetProps }) => [
                    settingsGroup(
                        <Settings {...widgetProps} handleImage={this.handleImage.bind(this)} />
                    ),
                    styleGroup()
                ]}
            </WidgetSettingsContainer>
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

export default ImageWithText;
