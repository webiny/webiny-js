import type { SerializedEditorState } from "lexical";

export enum CompanyStatus {
    DRAFT = "draft",
    PENDING_REVIEW = "pendingReview",
    CUSTOMER_TRAINING = "customerTraining",
    CUSTOMER_ONBOARDED = "customerOnboarded",
    CUSTOMER_LIVE = "customerLive",
    CUSTOMER_CLOSED = "customerClosed"
}

export interface CultureGroupRef {
    modelId: "cultureGroup";
    id: string;
}

interface CultureGroup {
    id: string;
    title: string;
    description: string;
}

export interface ContentRegionRef {
    modelId: "contentRegion";
    id: string;
}

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    company: {
        id: string;
    };
}

export interface Company {
    id: string;
    name: string;
    companyStatus: CompanyStatus;
    brandSettings: {
        logo: string;
        primaryColor: string;
        font: string;
    };
    contentSettings: {
        cultureGroups: Array<CultureGroupRef>;
        contentRegions: Array<ContentRegionRef>;
    };
    isInstalled: boolean;
}

export interface ListResponseMeta {
    cursor: string | null;
    hasMoreItems: boolean;
    totalCount: number;
}

export interface ResponseError {
    code: string;
    message: string;
    data: Record<string, any>;
}

export interface ReadonlyArticle {
    id: string;
    title: string;
    slug: string;
    description: string;
    region?: {
        id: string;
        slug: string;
        title: string;
    };
    language?: {
        id: string;
        name: string;
        slug: string;
    };
    heroImage: Array<ArticleHeroImage>;
    content: Array<GenericBlock>;
    seoTitle: string;
    seoDescription: string;
    seoMetaTags: Array<{
        tagName: string;
        tagValue: string;
    }>;
    translationBase?: {
        id: string;
    };
}

export type Translation = {
    languageId: string;
    articleSlug: string;
};

export interface ReadonlyArticleWithTranslations extends ReadonlyArticle {
    translations: Array<Translation>;
}

export interface ArticleHeroImage {
    image: string;
    cultureGroup: CultureGroup;
}

export enum Identity {
    Employee = "employee",
    Admin = "admin"
}

export interface ContentRegion {
    id: string;
    title: string;
    slug: string;
    languages: Array<ContentLanguage>;
}

export interface ContentLanguage {
    id: string;
    name: string;
    slug: string;
}

// Content blocks

export interface GenericBlock {
    __typename: string;
}

export interface TextWithImageBlock extends GenericBlock {
    title: string;
    content: SerializedEditorState;
    image: string;
}

export interface BannerBlock extends GenericBlock {
    title: string;
    actionUrl: string;
    actionLabel: string;
    image: string;
}

export interface ThreeGridBoxBlock extends GenericBlock {
    boxes: Array<{
        title: string;
        description: string;
        icon: string;
    }>;
}

export interface HeroBlock extends GenericBlock {
    title: string;
    subtitle: string;
    description: string;
    image: string;
    callToActionButtonLabel: string;
    callToActionButtonUrl: string;
}

export interface RichTextBlock extends GenericBlock {
    content: SerializedEditorState;
}
