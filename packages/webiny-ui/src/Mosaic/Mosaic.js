// @flow
import React, { useEffect, useRef, useState } from "react";
import { css } from "emotion";
import elementResizeDetectorMaker from "element-resize-detector";

type Props = {
    // An array of elements that need to be shown, for example images.
    children: React.Node,

    // Number of columns, per max screen size, eg. { "320": 1, "480": 2, "800": 3, "1366": 4 }.
    columnsCount: { [string]: number }
};

const styles = css({
    display: "block",
    "> react-mosaic-column": {
        display: "inline-block",
        verticalAlign: "top",
        "> react-mosaic-item": {
            display: "block",
            width: "100%",
            overflow: "hidden",
            float: "left"
        }
    }
});

function getColumnsCount({ columnsParams, width }) {
    if (Number.isInteger(columnsParams)) {
        return columnsParams;
    }

    const sortedWidths = Object.keys(columnsParams).sort((a, b) => a - b);
    for (let i = 0; i < sortedWidths.length; i++) {
        if (width <= sortedWidths[i]) {
            return columnsParams[sortedWidths[i]];
        }
    }

    // Return last.
    return columnsParams[sortedWidths[sortedWidths.length - 1]];
}

let elementResizeDetector = null;

function Mosaic(props: Props) {
    const mosaicRef = useRef();

    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        setContainerWidth(mosaicRef.current.offsetWidth);
        elementResizeDetector = elementResizeDetectorMaker({
            strategy: "scroll" //<- For ultra performance.
        });
        elementResizeDetector.listenTo(mosaicRef.current, element =>
            setContainerWidth(element.offsetWidth)
        );
        return () => {
            elementResizeDetector.uninstall();
            elementResizeDetector = null;
        };
    }, []);

    const { children, columns } = props;

    const columnsCount = getColumnsCount({ columnsParams: columns, width: containerWidth });

    const renderedColumns = [];
    for (let i = 0; i < columnsCount; i++) {
        renderedColumns.push([]);
    }

    const columnsIndexes = {
        current: 0,
        last: columnsCount - 1
    };

    for (let i = 0; i < children.length; i++) {
        renderedColumns[columnsIndexes.current].push(children[i]);
        if (columnsIndexes.current === columnsIndexes.last) {
            columnsIndexes.current = 0;
            continue;
        }
        columnsIndexes.current++;
    }

    return (
        <react-mosaic class={styles} ref={mosaicRef}>
            {renderedColumns.map((column, i) => (
                <react-mosaic-column key={i} style={{ width: `calc(100% / ${columnsCount})` }}>
                    {column.map((item, j) => (
                        <react-mosaic-item key={j}>{item}</react-mosaic-item>
                    ))}
                </react-mosaic-column>
            ))}
        </react-mosaic>
    );
}

Mosaic.defaultProps = {
    columns: { 320: 1, 480: 2, 800: 3, 1366: 4 }
};

export { Mosaic };
