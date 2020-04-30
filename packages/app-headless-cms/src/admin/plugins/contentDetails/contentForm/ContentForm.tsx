import * as React from "react";
import { css } from "emotion";
import { ContentModelForm } from "@webiny/app-headless-cms/admin/components/ContentModelForm";
import useReactRouter from "use-react-router";

const pageInnerWrapper = css({
    overflowY: "scroll",
    overflowX: "hidden",
    height: "calc(100vh - 230px)",
    position: "relative",
    ".webiny-pb-page-document": {
        transform: "scale(var(--webiny-pb-page-preview-scale))",
        transition: "transform 0.5s ease-in-out",
        transformOrigin: "top center"
    }
});

const ContentForm = ({ contentModel, content }) => {
    const query = new URLSearchParams(location.search);
    const { history } = useReactRouter();

    return (
        <div className={pageInnerWrapper}>
            <ContentModelForm
                contentModel={contentModel}
                content={content}
                onSubmitSuccess={response => {
                    const { id } = response;
                    query.set("id", id);
                    history.push({ search: query.toString() });
                }}
            />
        </div>
    );
};

export default ContentForm;
