/// <reference types="react" />
import { FilesRules } from "react-butterfiles";
declare type FileManagerViewProps = {
    onChange: Function;
    onClose: Function;
    files?: FilesRules;
    multiple: boolean;
    accept: Array<string>;
    maxSize: number | string;
    multipleMaxCount: number;
    multipleMaxSize: number | string;
};
declare function FileManagerView(props: FileManagerViewProps): JSX.Element;
declare namespace FileManagerView {
    var defaultProps: {
        multiple: boolean;
        maxSize: string;
        multipleMaxSize: string;
        multipleMaxCount: number;
    };
}
export default FileManagerView;
