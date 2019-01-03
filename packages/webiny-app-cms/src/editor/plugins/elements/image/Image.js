// @flow
import * as React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, withHandlers } from "recompose";
import { withFileUpload } from "webiny-app/components";
import { SingleImageUpload } from "webiny-ui/ImageUpload";
import { set } from "dot-prop-immutable";
import { get, isEqual } from "lodash";
import { updateElement } from "webiny-app-cms/editor/actions";
import { getElement } from "webiny-app-cms/editor/selectors";
import isNumeric from "isnumeric";

const Image = ({ element, onChange }) => {
    const { image = {} } = element.data;
    const { width, height } = image;
    const imgStyle = {};
    if (width) {
        imgStyle.width = isNumeric(width) ? parseInt(width) : width;
    }
    if (height) {
        imgStyle.height = isNumeric(height) ? parseInt(height) : height;
    }

    return (
        <div id={element.id}>
            <SingleImageUpload
                onChange={onChange}
                value={image}
                img={{ style: imgStyle }}
                showRemoveImageButton={false}
            />
        </div>
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
