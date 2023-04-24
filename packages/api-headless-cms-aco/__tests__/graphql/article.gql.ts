const getDataFields = () => {
    return /* GraphQL */ `
        data {
            id
            entryId
            title
            smallText
            bigText
            photo
        }
    `;
};

const getErrorFields = () => {
    return /* GraphQL */ `
        error {
            code
            data
            message
        }
    `;
};

export const CREATE_ARTICLE = () => {
    return /* GraphQL */ `
        mutation CreateArticle($data: ArticleInput!) {
            createArticle(data: $data) {
                ${getDataFields()}
                ${getErrorFields()}
            }
        }
    `;
};
export const DELETE_ARTICLE = () => {
    return /* GraphQL */ `
        mutation DeleteArticle($id: ID!) {
            deleteArticle(id: $id) {
                ${getDataFields()}
                ${getErrorFields()}
        }
    `;
};
export const PUBLISH_ARTICLE = () => {
    return /* GraphQL */ `
        mutation DeleteArticle($id: ID!) {
            deleteArticle(id: $id) {
                ${getDataFields()}
                ${getErrorFields()}
            }
        }
    `;
};
export const UNPUBLISH_ARTICLE = () => {
    return /* GraphQL */ `
        mutation UnpublishArticle($id: ID!) {
            unpublishArticle(id: $id) {
                ${getDataFields()}
                ${getErrorFields()}
            }
        }
    `;
};
export const UPDATE_ARTICLE = () => {
    return /* GraphQL */ `
        mutation UpdateArticle($revision: ID!, $data: ArticleInput!) {
            updateArticle(revision: $revision, data: $data) {
                ${getDataFields()}
                ${getErrorFields()}
            }
        }
    `;
};
