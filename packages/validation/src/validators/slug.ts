import ValidationError from "~/validationError";

export default (value: any) => {
    if (!value) {
        return;
    }
    value = value + "";

    if (value.match(/^[a-z]+(\-[a-z]+)*$/) && value.length <= 100) {
        return;
    }

    throw new ValidationError(
        "Slug must consist of only 'a-z' and '-' and be max 100 characters long (for example: 'some-entry-slug')"
    );
};
