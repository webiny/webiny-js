const getDataFields = () => {
    return /* GraphQL */ `
        data {
            id
            entryId
            title
            smallText
            bigText
            photo
            meta {
                version
                status
            }
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
export const CREATE_ARTICLE_FROM = () => {
    return /* GraphQL */ `
        mutation CreateArticleFrom($id: ID!) {
            createArticleFrom(revision: $id) {
                ${getDataFields()}
                ${getErrorFields()}
            }
        }
    `;
};
export const DELETE_ARTICLE = () => {
    return /* GraphQL */ `
        mutation DeleteArticle($id: ID!) {
            deleteArticle(revision: $id) {
                data
                ${getErrorFields()}
            }
        }
    `;
};
export const PUBLISH_ARTICLE = () => {
    return /* GraphQL */ `
        mutation PublishArticle($id: ID!) {
            publishArticle(revision: $id) {
                ${getDataFields()}
                ${getErrorFields()}
            }
        }
    `;
};
export const UNPUBLISH_ARTICLE = () => {
    return /* GraphQL */ `
        mutation UnpublishArticle($id: ID!) {
            unpublishArticle(revision: $id) {
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
