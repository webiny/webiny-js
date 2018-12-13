// @flow
import getSettingsFields from "./getSettingsFields";

const getDataFields = () => {
    return /* GraphQL */ `
        {
            id
            title
            url
            version
            publishedOn
            snippet
            content
            createdBy {
                firstName
                lastName
            }
            settings {
                _empty
                ${getSettingsFields()}
            }
            category {
                id
                name
            }
        }
    `;
};

export default getDataFields;
