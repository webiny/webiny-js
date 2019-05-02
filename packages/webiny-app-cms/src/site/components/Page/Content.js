// @flow
import React from "react";
import Element from "webiny-app-cms/render/components/Element";
import Layout from "./../Layout";
import { Helmet } from "react-helmet";
import { get } from "lodash";

type Props = { settings: Object, page: Object };

class Content extends React.Component<Props> {
    getPageTitle({ page, settings }: Object): string {
        let output = [];
        page.title && output.push(page.title);
        settings.name && output.push(settings.name);
        return output.join(" | ");
    }

    renderOgImageMeta({ page, settings }: Object) {
        let src = get(page, "social.image.src");
        if (!src) {
            src = get(settings, "social.image.src");
        }

        return src ? <meta property="og:image" content={src + "?width=1596"} /> : null;
    }

    render() {
        const { page, settings } = this.props;

        const meta = {
            page: {
                title: page.title,
                seo: {
                    title: "",
                    description: "",
                    meta: [],
                    ...get(page, "settings.seo")
                },
                social: {
                    title: "",
                    description: "",
                    image: null,
                    ...get(page, "settings.social")
                }
            },
            settings: {
                name: get(settings, "name") || "",
                social: {
                    image: null,
                    ...get(settings, "social")
                }
            }
        };

        return (
            <div className="webiny-cms-page">
                <Helmet>
                    <meta charSet="utf-8" />
                    <title>{this.getPageTitle(meta)}</title>
                    {meta.page.seo.title && <meta name="title" content={meta.page.seo.title} />}
                    {meta.page.seo.description && (
                        <meta name="description" content={meta.page.seo.description} />
                    )}
                    {meta.page.seo.meta.map(({ name, content }, index) => (
                        <meta key={index} name={name} content={content} />
                    ))}

                    {this.renderOgImageMeta(meta)}
                    {meta.page.social.title && (
                        <meta property="og:title" content={meta.page.social.title} />
                    )}

                    {meta.page.social.description && (
                        <meta property="og:description" content={meta.page.social.description} />
                    )}
                    {meta.page.social.meta.map(({ property, content }, index) => (
                        <meta key={index} property={`og:${property}`} content={content} />
                    ))}
                </Helmet>
                <Layout layout={page.settings.general.layout}>
                    <Element element={page.content} />
                </Layout>
            </div>
        );
    }
}

export default Content;
