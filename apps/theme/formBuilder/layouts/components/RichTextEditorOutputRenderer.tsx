import React, { useMemo } from "react";

const RichTextEditorOutputRenderer = ({ data }) => {
    const render = useMemo(() => {
        if (!Array.isArray(data)) {
            return null;
        }
        // TODO: Refactor renderer in plugins
        return data.map((item, index) => {
            switch (item.type) {
                case "header":
                    switch (item.data.level) {
                        case 1:
                            return <h1 key={index}>{item.data.text}</h1>;

                        case 2:
                            return <h2 key={index}>{item.data.text}</h2>;

                        case 3:
                            return <h3 key={index}>{item.data.text}</h3>;

                        case 4:
                            return <h4 key={index}>{item.data.text}</h4>;

                        case 5:
                            return <h5 key={index}>{item.data.text}</h5>;

                        case 6:
                            return <h6 key={index}>{item.data.text}</h6>;
                    }
                    break;
                case "paragraph":
                    return <p key={index} dangerouslySetInnerHTML={{ __html: item.data.text }} />;

                case "image":
                    return <img key={index} alt={item.data.caption} src={item.data.file.src} />;

                case "quote":
                    return (
                        <blockquote key={index}>
                            <p>{item.data.text}</p>
                        </blockquote>
                    );

                case "list":
                    switch (item.data.style) {
                        case "unordered":
                            return (
                                <ul key={index}>
                                    {item.data.items.map((text, i) => (
                                        <li key={i}>{text}</li>
                                    ))}
                                </ul>
                            );

                        case "ordered":
                            return (
                                <ol key={index}>
                                    {item.data.items.map((text, i) => (
                                        <li key={i}>{text}</li>
                                    ))}
                                </ol>
                            );
                    }
                    break;
                default:
                    return <p key={index}>Unable to load renderer for type: {item.type}</p>;
            }
        });
    }, [data]);

    return <div>{render}</div>;
};

export default RichTextEditorOutputRenderer;
