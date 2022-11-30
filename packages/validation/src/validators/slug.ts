import ValidationError from "~/validationError";

export default (value: any) => {
    if (!value) {
        return;
    }
    value = value + "";

    if (value.match(/^[a-z0-9]+(-[a-z0-9]+)*$/) && value.length <= 100) {
        return;
    }

    throw new ValidationError(
        "Slug must consist of only 'a-z', '0-9' and '-' and be max 100 characters long (for example: 'some-slug' or 'some_slug-2')"
    );
};
