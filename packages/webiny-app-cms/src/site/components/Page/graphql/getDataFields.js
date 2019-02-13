// @flow
import getPageSettingsFields from "./getPageSettingsFields";

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
                ${getPageSettingsFields()}
            }
            category {
                id
                name
            }
        }
    `;
};

export default getDataFields;
