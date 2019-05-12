// @flow
import * as React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import styled from "react-emotion";
import isNumeric from "isnumeric";
import { compose, withHandlers, pure } from "recompose";
import { set, isEqual } from "lodash";
import SingleImageUpload from "webiny-admin/components/SingleImageUpload";
import { updateElement } from "webiny-app-cms/editor/actions";
import { getElement } from "webiny-app-cms/editor/selectors";

const position = { left: "flex-start", center: "center", right: "flex-end" };

const AlignImage = styled("div")(props => ({
    img: {
        alignSelf: position[props.align]
    }
}));

const ImageContainer = pure(props => {
    const { horizontalAlign, onChange } = props;
    const image = { ...props.image };

    const imgStyle = {};
    if (image.width) {
        const { width } = image;
        imgStyle.width = isNumeric(width) ? parseInt(width) : width;
    }
    if (image.height) {
        const { height } = image;
        imgStyle.height = isNumeric(height) ? parseInt(height) : height;
    }

    return (
        <AlignImage align={horizontalAlign}>
            <SingleImageUpload
                imagePreviewProps={{ style: imgStyle, srcSet: "auto" }}
                onChange={onChange}
                value={image}
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
    withHandlers({
        onChange: ({ updateElement, element }) => async data => {
            updateElement({ element: set(element, "data.image", data), merge: true });
        }
    })
)(ImageContainer);
