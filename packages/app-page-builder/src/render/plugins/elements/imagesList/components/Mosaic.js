// @flow
import * as React from "react";
import { Mosaic as UiMosaic } from "@webiny/ui/Mosaic";
import Lightbox from "react-images";

const { useReducer } = React;

const reducer = (state, action) => {
    const next = { ...state };
    switch (action.type) {
        case "open":
            next.open = true;
            next.currentIndex = action.index || 0;
            break;
        case "close":
            next.open = false;
            break;
        case "next":
            next.currentIndex = next.currentIndex + 1;
            break;
        case "prev":
            next.currentIndex = next.currentIndex - 1;
            break;
    }
    return next;
};

const useLightbox = () => {
    const [state, dispatch] = useReducer(reducer, {
        open: false,
        currentIndex: null
    });

    return {
        opened: state.open,
        currentIndex: state.currentIndex,
        open: index => dispatch({ type: "open", index }),
        close: () => dispatch({ type: "close" }),
        next: () => dispatch({ type: "next" }),
        prev: () => dispatch({ type: "prev" })
    };
};

export default function Mosaic(props) {
    const { data } = props;
    const { opened, open, close, next, prev, currentIndex } = useLightbox();

    if (Array.isArray(data)) {
        return (
            <>
                <UiMosaic>
                    {data.map((item, i) => (
                        <img
                            onClick={() => open(i)}
                            style={{ width: "100%", display: "block" }}
                            key={i + item.src}
                            src={item.src}
                        />
                    ))}
                </UiMosaic>

                <Lightbox
                    images={data}
                    currentImage={currentIndex}
                    isOpen={opened}
                    onClickPrev={prev}
                    onClickNext={next}
                    onClose={close}
                />
            </>
        );
    }

    return <span>No images to display.</span>;
}
