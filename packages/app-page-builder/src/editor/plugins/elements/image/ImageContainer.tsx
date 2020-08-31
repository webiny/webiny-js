import React, { useCallback } from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import styled from "@emotion/styled";
import isNumeric from "isnumeric";
import { set, isEqual } from "lodash";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import { updateElement } from "@webiny/app-page-builder/editor/actions";
import { getElement } from "@webiny/app-page-builder/editor/selectors";

const position = { left: "flex-start", center: "center", right: "flex-end" };

const AlignImage = styled("div")((props: any) => ({
    img: {
        alignSelf: position[props.align]
    }
}));

const ImageContainer = props => {
    const { horizontalAlign, updateElement, element } = props;
    console.log("IMAGE CONTAINER");

    let image = { ...props.image };
    let imageDimensions = document.createElement('img');
    imageDimensions.src = file.src;
    console.log(image);
    const imgStyle = { width: null, height: null };
    if (image.width) {
        const { width } = image;
        imgStyle.width = isNumeric(width) ? parseInt(width) : width;
    } else {
        console.log("no width");
        let poll = setInterval(function () {
            if (imageDimensions.naturalWidth) {
                clearInterval(poll);
            }
        }, 10);
        imageDimensions.onload = function () { 
            console.log('Fully loaded'); 
            console.log(imageDimensions.naturalWidth);
            image.width = imageDimensions.naturalWidth;
        }
    }

    if (image.height) {
        const { height } = image;
        imgStyle.height = isNumeric(height) ? parseInt(height) : height;
    } else {
        console.log("no heigth");
        let poll = setInterval(function () {
            if (imageDimensions.naturalHeight) {
                clearInterval(poll);
            }
        }, 10);
        imageDimensions.onload = function () { 
            console.log('Fully loaded');
            console.log(imageDimensions.naturalHeight);
            image.height = imageDimensions.naturalHeight;
        }
    }

    const onChange = useCallback(
        async data => {
            updateElement({ element: set(element, "data.image.file", data), merge: true });
        },
        [element]
    );

    return (
        <AlignImage align={horizontalAlign}>
            <SingleImageUpload
                imagePreviewProps={{ style: imgStyle, srcSet: "auto" }}
                onChange={onChange}
                value={image.file}
            />
        </AlignImage>
    );
};

export default connect<any, any, any>(
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
)(React.memo(ImageContainer));
