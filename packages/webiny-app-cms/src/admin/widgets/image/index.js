import React from "react";
import compose from "webiny-compose";
import _ from "lodash";
import { app } from "webiny-app";
import EditorWidget from "../../../utils/EditorWidget";

import ImageWidgetSettingsCmp from "./Settings";
import image from "./text-image.png";

class ImageWidget extends EditorWidget {
    removeWidget({ widget }) {
        if (widget.data.image) {
            return this.deleteImage(widget.data.image.id);
        }
    }

    renderSelector() {
        return <img src={image} alt={"Image with text"} width={"100%"} />;
    }

    renderWidget() {
        return <img src={image} alt={"Image with text"} width={"100%"} />;
    }

    renderSettings({ WidgetSettingsContainer }) {
        return (
            <WidgetSettingsContainer>
                {({ settingsTab }) => (
                    <React.Fragment>
                        {settingsTab(<ImageWidgetSettingsCmp handleImage={this.handleImage} />)}
                        {/*{cssTab()}
                        {customTab(<Tabs.Tab label={"Data"} />)}
                        {customTab(<Tabs.Tab label={"Images"} />)}*/}
                    </React.Fragment>
                )}
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

export default ImageWidget;
