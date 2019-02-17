// @flow
import * as React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import styled from "react-emotion";
import isNumeric from "isnumeric";
import { compose, withHandlers, pure } from "recompose";
import { set, isEqual } from "lodash";
import { withFileUpload, SingleImageUpload, Image } from "webiny-app/components";
import { updateElement } from "webiny-app-cms/editor/actions";
import { getElement } from "webiny-app-cms/editor/selectors";

const position = { left: "flex-start", center: "center", right: "flex-end" };

const AlignImage = styled("div")(props => ({
    img: {
        alignSelf: position[props.align]
    }
}));

const ImageContainer = pure(({ image, horizontalAlign, onChange }) => {
    const { width, height, responsive } = image;

    const imgStyle = {};
    if (width) {
        imgStyle.width = isNumeric(width) ? parseInt(width) : width;
    }
    if (height) {
        imgStyle.height = isNumeric(height) ? parseInt(height) : height;
    }

    return (
        <AlignImage align={horizontalAlign}>
            <SingleImageUpload
                renderImagePreview={props => (
                    <Image {...props} responsive={responsive} style={imgStyle} />
                )}
                onChange={onChange}
                value={image}
                showRemoveImageButton={false}
            />
        </AlignImage>
    );
});

export default compose(
    connect(
        (state, { elementId }) => {
            const element = getElement(state, elementId);
            const { image = {}, settings = {} } = element.data;

            return {
                element: { id: element.id, type: element.type, path: element.path },
                image,
                horizontalAlign: settings.horizontalAlign || "center"
            };
        },
        { updateElement },
        null,
        { areStatePropsEqual: isEqual }
    ),
    withFileUpload(),
    withHandlers({
        onChange: ({ uploadFile, updateElement, element }) => async data => {
            const response = await uploadFile(data);
            updateElement({ element: set(element, "data.image", response), merge: true });
        }
    })
)(ImageContainer);
