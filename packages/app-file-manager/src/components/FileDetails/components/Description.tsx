import React from "react";
import bytes from "bytes";
import dayjs from "dayjs";
import { useFile } from "~/hooks/useFile.js";

const formatFileSize = (size: number) => {
    return bytes.format(size, { unitSeparator: " " });
};

const formatDate = (date: string | Date) => {
    return dayjs(date).format("DD MMM YYYY, HH:mm");
};

export const Description = () => {
    const { file } = useFile();

    if (!file) {
        return null;
    }

    return (
        <span>
            Type: {file.type} {" // "}
            Size: {formatFileSize(file.size)} {" // "}
            Upload date: {formatDate(file.createdOn)}
        </span>
    );
};
