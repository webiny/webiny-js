import React, { useReducer } from "react";
import { ImagesListComponent } from "../types";
import { EmptyElement } from "~/renderers/components";

/**
 * Package react-columned does not have types.
 */
// @ts-expect-error
import Columned from "react-columned";
import Lightbox from "react-images";

const COLUMNS = { 320: 1, 480: 2, 800: 3, 1366: 4 };

interface State {
    open: boolean;
    currentIndex: number;
}

interface Action {
    type: "open" | "close" | "next" | "prev";
    index?: number;
}

const reducer = (state: State, action: Action) => {
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
        currentIndex: 0
    });

    return {
        opened: state.open,
        currentIndex: state.currentIndex,
        open: (index: number) => dispatch({ type: "open", index }),
        close: () => dispatch({ type: "close" }),
        next: () => dispatch({ type: "next" }),
        prev: () => dispatch({ type: "prev" })
    };
};

export const createDefaultImagesListComponent = (): ImagesListComponent =>
    function DefaultImagesListComponent(props) {
        const { opened, open, close, next, prev, currentIndex } = useLightbox();

        const { images } = props;
        if (Array.isArray(images) && images.length > 0) {
            return (
                <>
                    <Columned columns={COLUMNS}>
                        {images.map((item, i) => (
                            <img
                                onClick={() => open(i)}
                                style={{ width: "100%", display: "block" }}
                                key={i + item.src}
                                src={item.src}
                            />
                        ))}
                    </Columned>

                    <Lightbox
                        images={images}
                        currentImage={currentIndex}
                        isOpen={opened}
                        onClickPrev={prev}
                        onClickNext={next}
                        onClose={close}
                    />
                </>
            );
        }

        return <EmptyElement message="No images to display." />;
    };
