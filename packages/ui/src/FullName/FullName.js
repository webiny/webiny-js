// @flow
type Props = {
    data: ?{
        firstName?: ?string,
        lastName?: ?string
    }
} & Object;

const FullName = (props: Props) => {
    const { data } = props;

    if (!data) {
        return "N/A";
    }

    let output = "";
    if (data.firstName) {
        output += data.firstName;
    }

    if (data.lastName) {
        output += " " + data.lastName;
    }

    return output;
};

export { FullName };
