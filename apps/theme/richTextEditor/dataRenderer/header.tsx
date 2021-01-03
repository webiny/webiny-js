import React from "react";
import classNames from "classnames";
import { RTEDataBlockRendererPlugin } from "../../types";

export default () =>
    ({
        type: "rte-data-block-renderer",
        name: "rte-data-block-renderer-header",
        outputType: "react",
        blockType: "header",
        render(block) {
            const props = { style: {}, className: null };

            if (block.data.textAlign) {
                props.style["textAlign"] = block.data.textAlign;
            }
            if (block.data.className) {
                props.className = block.data.className;
            }

            switch (block.data.level) {
                case 1:
                    return (
                        <h1
                            {...props}
                            className={classNames(
                                props.className,
                                "rte-block-heading rte-block-heading--h1"
                            )}
                            dangerouslySetInnerHTML={{ __html: block.data.text }}
                        />
                    );

                case 2:
                    return (
                        <h2
                            {...props}
                            className={classNames(
                                props.className,
                                "rte-block-heading rte-block-heading--h2"
                            )}
                            dangerouslySetInnerHTML={{ __html: block.data.text }}
                        />
                    );

                case 3:
                    return (
                        <h3
                            {...props}
                            className={classNames(
                                props.className,
                                "rte-block-heading rte-block-heading--h3"
                            )}
                            dangerouslySetInnerHTML={{ __html: block.data.text }}
                        />
                    );

                case 4:
                    return (
                        <h4
                            {...props}
                            className={classNames(
                                props.className,
                                "rte-block-heading rte-block-heading--h4"
                            )}
                            dangerouslySetInnerHTML={{ __html: block.data.text }}
                        />
                    );

                case 5:
                    return (
                        <h5
                            {...props}
                            className={classNames(
                                props.className,
                                "rte-block-heading rte-block-heading--h5"
                            )}
                            dangerouslySetInnerHTML={{ __html: block.data.text }}
                        />
                    );

                case 6:
                    return (
                        <h6
                            {...props}
                            className={classNames(
                                props.className,
                                "rte-block-heading rte-block-heading--h6"
                            )}
                            dangerouslySetInnerHTML={{ __html: block.data.text }}
                        />
                    );
            }
        }
    } as RTEDataBlockRendererPlugin);
