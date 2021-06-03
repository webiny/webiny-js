import { CmsFieldFilterPathPlugin } from "../../types";

export default (): CmsFieldFilterPathPlugin => ({
    type: "cms-field-filter-path",
    name: "cms-field-filter-path-ref",
    fieldType: "ref",
    createPath: ({ field, index }) => {
        const paths: string[] = [field.fieldId];
        if (index !== undefined) {
            paths.push(String(index));
        }
        paths.push("entryId");
        return paths.join(".");
    }
});
