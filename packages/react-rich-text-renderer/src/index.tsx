import React from "react";
import classNames from "classnames";
import { OutputBlockData as BaseOutputBlockData } from "@editorjs/editorjs";
import sanitize from "sanitize-html";

interface OutputBlockData extends BaseOutputBlockData {
    data: {
        className?: string;
        textAlign?: string;
        text: string;
        caption?: string;
        file?: string;
        level: number;
        items: string[];
        style: string;
    };
}

interface RenderParagraphProps {
    style: {
        [key: string]: string;
    };
    className: string;
}

const renderParagraph = (
    block: OutputBlockData,
    sanitizeOptions?: sanitize.IOptions
): React.ReactElement => {
    const props: RenderParagraphProps = { style: {}, className: "" };

    if (block.data.textAlign) {
        props.style["textAlign"] = block.data.textAlign;
    }
    if (block.data.className) {
        props.className = block.data.className;
    }
    return (
        <p
            {...props}
            className={classNames("rte-block-paragraph", props.className)}
            dangerouslySetInnerHTML={{ __html: sanitize(block.data.text, sanitizeOptions) }}
        />
    );
};

const renderDelimiter = () => {
    return <div className="rte-block-delimiter" />;
};

interface RenderHeaderProps {
    style: {
        [key: string]: string;
    };
    className: string;
}

const renderHeader = (block: OutputBlockData, sanitizeOptions?: sanitize.IOptions) => {
    const props: RenderHeaderProps = { style: {}, className: "" };

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
                    dangerouslySetInnerHTML={{
                        __html: sanitize(block.data.text, sanitizeOptions)
                    }}
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
                    dangerouslySetInnerHTML={{
                        __html: sanitize(block.data.text, sanitizeOptions)
                    }}
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
                    dangerouslySetInnerHTML={{
                        __html: sanitize(block.data.text, sanitizeOptions)
                    }}
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
                    dangerouslySetInnerHTML={{
                        __html: sanitize(block.data.text, sanitizeOptions)
                    }}
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
                    dangerouslySetInnerHTML={{
                        __html: sanitize(block.data.text, sanitizeOptions)
                    }}
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
                    dangerouslySetInnerHTML={{
                        __html: sanitize(block.data.text, sanitizeOptions)
                    }}
                />
            );
        default:
            return null;
    }
};

function renderImage(block: OutputBlockData) {
    return <img className={"rte-block-image"} alt={block.data.caption} src={block.data.file} />;
}

function renderList(block: OutputBlockData) {
    switch (block.data.style) {
        case "unordered":
            return (
                <ul className={"rte-block-list"}>
                    {block.data.items.map((text, i) => (
                        <li key={i}>{text}</li>
                    ))}
                </ul>
            );

        case "ordered":
            return (
                <ol className={"rte-block-list"}>
                    {block.data.items.map((text, i) => (
                        <li key={i}>{text}</li>
                    ))}
                </ol>
            );
        default:
            return null;
    }
}

function renderQuote(block: OutputBlockData) {
    return (
        <blockquote className={"rte-block-blockquote"}>
            <p>{block.data.text}</p>
        </blockquote>
    );
}

const defaultRenderers: Record<string, RichTextBlockRenderer> = {
    delimiter: renderDelimiter,
    header: renderHeader,
    image: renderImage,
    list: renderList,
    paragraph: renderParagraph,
    quote: renderQuote
};

export interface RichTextBlockRenderer {
    (block: OutputBlockData, sanitizeOptions?: sanitize.IOptions): React.ReactNode;
}

interface RichTextRendererProps {
    data: OutputBlockData[];
    renderers?: Record<string, RichTextBlockRenderer>;
    /*
     * You can find more about sanitize configuration here: https://github.com/apostrophecms/sanitize-html
     * */
    sanitizationConfig?: sanitize.IOptions;
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = props => {
    // Combine default renderers with custom renderers
    const renderers = Object.assign({}, defaultRenderers, props.renderers);

    return (
        <React.Fragment>
            {props.data.map((block, index) => {
                const renderer = renderers[block.type];
                if (!renderer) {
                    return null;
                }

                const node = renderer(block, props?.sanitizationConfig);
                if (React.isValidElement(node)) {
                    return React.cloneElement(node, { key: index });
                }

                return null;
            })}
        </React.Fragment>
    );
};
