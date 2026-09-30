import React from "react";
import type { FileItemFormatted } from "~/FilePicker/index.js";

import csvThumb from "../assets/csv.svg";
import docThumb from "../assets/doc.svg";
import docxThumb from "../assets/docx.svg";
import fileThumb from "../assets/file.svg";
import pdfThumb from "../assets/pdf.svg";
import pptThumb from "../assets/ppt.svg";
import pptxThumb from "../assets/pptx.svg";
import txtThumb from "../assets/txt.svg";
import xlsThumb from "../assets/xls.svg";
import xlsxThumb from "../assets/xlsx.svg";

type FileTypeProps = Pick<FileItemFormatted, "mimeType" | "name">;

/**
 * The stand-in for a file that cannot be shown as a picture: an icon of its format, falling back
 * to a generic one for anything unrecognised.
 */
const FileType = ({ mimeType = "", name }: FileTypeProps) => {
    const getMimeTypeSrc = (mimeType: string) => {
        switch (mimeType) {
            case "text/csv": // .csv
                return csvThumb;
            case "application/msword": // .doc
                return docThumb;
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": // .docx
                return docxThumb;
            case "application/pdf": // .pdf
                return pdfThumb;
            case "application/vnd.ms-powerpoint": // .ppt
                return pptThumb;
            case "application/vnd.openxmlformats-officedocument.presentationml.presentation": // .pptx
                return pptxThumb;
            case "text/plain": // .txt
                return txtThumb;
            case "application/vnd.ms-excel": // .xls
                return xlsThumb;
            case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": // .xlsx
                return xlsxThumb;
            default:
                return fileThumb;
        }
    };

    return (
        <img
            src={getMimeTypeSrc(mimeType)}
            alt={name}
            className="size-full object-contain p-sm-extra"
        />
    );
};

export { FileType, type FileTypeProps };
