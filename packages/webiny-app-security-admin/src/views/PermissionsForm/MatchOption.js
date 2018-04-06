/**
 * Common function for matching classes and classIds in endpoint/service modal dialog
 */
export default ({ term, option }) => {
    let found = false;
    const { data } = option;
    if (data.classId.toLowerCase().includes(term.toLowerCase())) {
        found = true;
    }

    if (found) {
        return option;
    }

    return null;
};
