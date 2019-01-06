// @flow
import * as React from "react";
import styled from "react-emotion";
import isNumeric from "isnumeric";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, withHandlers } from "recompose";
import { withFileUpload } from "webiny-app/components";
import { SingleImageUpload } from "webiny-ui/ImageUpload";
import { set } from "dot-prop-immutable";
import { isEqual } from "lodash";
import { updateElement } from "webiny-app-cms/editor/actions";
import { getElement } from "webiny-app-cms/editor/selectors";
import { ElementRoot } from "webiny-app-cms/render/components/ElementRoot";

const position = { left: "flex-start", center: "center", right: "flex-end" };

const AlignImage = styled("div")(props => ({
    img: {
        alignSelf: position[props.align]
    }
}));

const Image = ({ element, onChange }) => {
    const { image = {}, settings = {} } = element.data || {};
    const { width, height } = image;
    const { horizontalAlign = "center" } = settings;

    const imgStyle = {};
    if (width) {
        imgStyle.width = isNumeric(width) ? parseInt(width) : width;
    }
    if (height) {
        imgStyle.height = isNumeric(height) ? parseInt(height) : height;
    }

    return (
        <ElementRoot
            element={element}
            className={"webiny-cms-base-element-style webiny-cms-element-image"}
        >
            <AlignImage id={element.id} align={horizontalAlign}>
                <SingleImageUpload
                    onChange={onChange}
                    value={image}
                    img={{ style: imgStyle }}
                    showRemoveImageButton={false}
                />
            </AlignImage>
        </ElementRoot>
    );
};

export default compose(
    connect(
        (state, props) => ({ element: getElement(state, props.elementId) }),
        { updateElement },
        null,
        { areStatePropsEqual: isEqual }
    ),
    withFileUpload(),
    withHandlers({
        onChange: ({ uploadFile, updateElement, element }) => async data => {
            const response = await uploadFile(data);
            updateElement({ element: set(element, "data.image", response) });
        }
    })
)(Image);
