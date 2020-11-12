import React, { ReactNode } from "react";
import { Helmet } from "react-helmet";
import { css } from "emotion";

const style = css({
    padding: 50,
    textAlign: "center",
    fontSize: 18,
    h1: {
        fontSize: 30,
        fontWeight: "bold",
        padding: 50
    },
    p: {
        lineHeight: 1.5
    }
});

export type DefaultPageProps = { title?: ReactNode; message?: ReactNode };

export default function DefaultPage({ title, message }: DefaultPageProps) {
    return (
        <div className={style}>
            <Helmet>
                <title>{title}</title>
            </Helmet>
            <h1>{title}</h1>

            <div>{message}</div>
        </div>
    );
}
