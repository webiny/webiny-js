import * as React from "react";
import { css } from "emotion";
import { Image } from "@webiny/app/components";
import { useFile } from "~/hooks/useFile";

const styles = css({
    width: "auto"
});

const width300 = { width: 300 };

export const ImageRenderer = () => {
    const { file } = useFile();
    return <Image className={styles} src={file.src} alt={file.name} transform={width300} />;
};
