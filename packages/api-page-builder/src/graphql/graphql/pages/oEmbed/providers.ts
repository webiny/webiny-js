interface ProviderEndpoint {
    schemes?: string[];
    url: string;
    formats?: string[];
    discovery?: boolean;
}

interface ProviderItem {
    provider_name: string;
    provider_url: string;
    endpoints: ProviderEndpoint[];
}

export const providerList: ProviderItem[] = [
    {
        provider_name: "23HQ",
        provider_url: "http://www.23hq.com",
        endpoints: [
            {
                schemes: ["http://www.23hq.com/*/photo/*"],
                url: "http://www.23hq.com/23/oembed"
            }
        ]
    },
    {
        provider_name: "Adways",
        provider_url: "http://www.adways.com",
        endpoints: [
            {
                schemes: ["http://play.adpaths.com/experience/*"],
                url: "http://play.adpaths.com/oembed/*"
            }
        ]
    },
    {
        provider_name: "Alpha App Net",
        provider_url: "https://alpha.app.net/browse/posts/",
        endpoints: [
            {
                schemes: ["https://alpha.app.net/*/post/*", "https://photos.app.net/*/*"],
                url: "https://alpha-api.app.net/oembed",
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "amCharts Live Editor",
        provider_url: "http://live.amcharts.com/",
        endpoints: [
            {
                schemes: ["http://live.amcharts.com/*"],
                url: "http://live.amcharts.com/oembed"
            }
        ]
    },
    {
        provider_name: "Animatron",
        provider_url: "https://www.animatron.com/",
        endpoints: [
            {
                schemes: ["https://www.animatron.com/project/*", "https://animatron.com/project/*"],
                url: "https://animatron.com/oembed/json",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Animoto",
        provider_url: "http://animoto.com/",
        endpoints: [
            {
                schemes: ["http://animoto.com/play/*"],
                url: "http://animoto.com/oembeds/create"
            }
        ]
    },
    {
        provider_name: "Audiomack",
        provider_url: "https://www.audiomack.com",
        endpoints: [
            {
                schemes: [
                    "https://www.audiomack.com/song/*",
                    "https://www.audiomack.com/album/*",
                    "https://www.audiomack.com/playlist/*"
                ],
                url: "https://www.audiomack.com/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "AudioSnaps",
        provider_url: "http://audiosnaps.com",
        endpoints: [
            {
                schemes: ["http://audiosnaps.com/k/*"],
                url: "http://audiosnaps.com/service/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Beautiful.AI",
        provider_url: "https://www.beautiful.ai/",
        endpoints: [
            {
                url: "https://www.beautiful.ai/api/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Blackfire.io",
        provider_url: "https://blackfire.io",
        endpoints: [
            {
                schemes: [
                    "https://blackfire.io/profiles/*/graph",
                    "https://blackfire.io/profiles/compare/*/graph"
                ],
                url: "https://blackfire.io/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Box Office Buz",
        provider_url: "http://boxofficebuz.com",
        endpoints: [
            {
                url: "http://boxofficebuz.com/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Buttondown",
        provider_url: "https://buttondown.email/",
        endpoints: [
            {
                schemes: ["https://buttondown.email/*"],
                url: "https://buttondown.email/embed",
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "Cacoo",
        provider_url: "https://cacoo.com",
        endpoints: [
            {
                schemes: ["https://cacoo.com/diagrams/*"],
                url: "http://cacoo.com/oembed.json"
            }
        ]
    },
    {
        provider_name: "Carbon Health",
        provider_url: "https://carbonhealth.com",
        endpoints: [
            {
                schemes: ["https://carbonhealth.com/practice/*"],
                url: "http://carbonhealth.com/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "CatBoat",
        provider_url: "http://img.catbo.at/",
        endpoints: [
            {
                schemes: ["http://img.catbo.at/*"],
                url: "http://img.catbo.at/oembed.json",
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "Ceros",
        provider_url: "http://www.ceros.com/",
        endpoints: [
            {
                schemes: ["http://view.ceros.com/*"],
                url: "http://view.ceros.com/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "ChartBlocks",
        provider_url: "http://www.chartblocks.com/",
        endpoints: [
            {
                schemes: ["http://public.chartblocks.com/c/*"],
                url: "http://embed.chartblocks.com/1.0/oembed"
            }
        ]
    },
    {
        provider_name: "chirbit.com",
        provider_url: "http://www.chirbit.com/",
        endpoints: [
            {
                schemes: ["http://chirb.it/*"],
                url: "http://chirb.it/oembed.json",
                discovery: true
            }
        ]
    },
    {
        provider_name: "CircuitLab",
        provider_url: "https://www.circuitlab.com/",
        endpoints: [
            {
                schemes: ["https://www.circuitlab.com/circuit/*"],
                url: "https://www.circuitlab.com/circuit/oembed/",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Clipland",
        provider_url: "http://www.clipland.com/",
        endpoints: [
            {
                schemes: ["http://www.clipland.com/v/*", "https://www.clipland.com/v/*"],
                url: "https://www.clipland.com/api/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Clyp",
        provider_url: "http://clyp.it/",
        endpoints: [
            {
                schemes: ["http://clyp.it/*", "http://clyp.it/playlist/*"],
                url: "http://api.clyp.it/oembed/",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Codepen",
        provider_url: "https://codepen.io",
        endpoints: [
            {
                schemes: ["http://codepen.io/*", "https://codepen.io/*"],
                url: "http://codepen.io/api/oembed"
            }
        ]
    },
    {
        provider_name: "Codepoints",
        provider_url: "https://codepoints.net",
        endpoints: [
            {
                schemes: [
                    "http://codepoints.net/*",
                    "https://codepoints.net/*",
                    "http://www.codepoints.net/*",
                    "https://www.codepoints.net/*"
                ],
                url: "https://codepoints.net/api/v1/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "CodeSandbox",
        provider_url: "https://codesandbox.io",
        endpoints: [
            {
                schemes: ["https://codesandbox.io/s/*", "https://codesandbox.io/embed/*"],
                url: "https://codesandbox.io/oembed"
            }
        ]
    },
    {
        provider_name: "CollegeHumor",
        provider_url: "http://www.collegehumor.com/",
        endpoints: [
            {
                schemes: ["http://www.collegehumor.com/video/*"],
                url: "http://www.collegehumor.com/oembed.json",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Commaful",
        provider_url: "https://commaful.com",
        endpoints: [
            {
                schemes: ["https://commaful.com/play/*"],
                url: "https://commaful.com/api/oembed/"
            }
        ]
    },
    {
        provider_name: "Coub",
        provider_url: "http://coub.com/",
        endpoints: [
            {
                schemes: ["http://coub.com/view/*", "http://coub.com/embed/*"],
                url: "http://coub.com/api/oembed.json"
            }
        ]
    },
    {
        provider_name: "Crowd Ranking",
        provider_url: "http://crowdranking.com",
        endpoints: [
            {
                schemes: ["http://crowdranking.com/*/*"],
                url: "http://crowdranking.com/api/oembed.json"
            }
        ]
    },
    {
        provider_name: "Cyrano Systems",
        provider_url: "http://www.cyranosystems.com/",
        endpoints: [
            {
                schemes: [
                    "https://staging.cyranosystems.com/msg/*",
                    "https://app.cyranosystems.com/msg/*"
                ],
                url: "https://staging.cyranosystems.com/oembed",
                formats: ["json"],
                discovery: true
            }
        ]
    },
    {
        provider_name: "Daily Mile",
        provider_url: "http://www.dailymile.com",
        endpoints: [
            {
                schemes: ["http://www.dailymile.com/people/*/entries/*"],
                url: "http://api.dailymile.com/oembed?format=json",
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "Dailymotion",
        provider_url: "http://www.dailymotion.com",
        endpoints: [
            {
                schemes: ["http://www.dailymotion.com/video/*"],
                url: "http://www.dailymotion.com/services/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Deviantart.com",
        provider_url: "http://www.deviantart.com",
        endpoints: [
            {
                schemes: [
                    "http://*.deviantart.com/art/*",
                    "http://*.deviantart.com/*#/d*",
                    "http://fav.me/*",
                    "http://sta.sh/*"
                ],
                url: "http://backend.deviantart.com/oembed"
            }
        ]
    },
    {
        provider_name: "Didacte",
        provider_url: "https://www.didacte.com/",
        endpoints: [
            {
                schemes: ["https://*.didacte.com/a/course/*"],
                url: "https://*.didacte.com/cards/oembed'",
                discovery: true,
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "Digiteka",
        provider_url: "https://www.ultimedia.com/",
        endpoints: [
            {
                schemes: [
                    "https://www.ultimedia.com/central/video/edit/id/*/topic_id/*/",
                    "https://www.ultimedia.com/default/index/videogeneric/id/*/showtitle/1/viewnc/1",
                    "https://www.ultimedia.com/default/index/videogeneric/id/*"
                ],
                url: "https://www.ultimedia.com/api/search/oembed"
            }
        ]
    },
    {
        provider_name: "Dipity",
        provider_url: "http://www.dipity.com",
        endpoints: [
            {
                schemes: ["http://www.dipity.com/*/*/"],
                url: "http://www.dipity.com/oembed/timeline/"
            }
        ]
    },
    {
        provider_name: "DocDroid",
        provider_url: "https://www.docdroid.net/",
        endpoints: [
            {
                schemes: [
                    "https://*.docdroid.net/*",
                    "http://*.docdroid.net/*",
                    "https://docdro.id/*",
                    "http://docdro.id/*"
                ],
                url: "https://www.docdroid.net/api/oembed",
                formats: ["json"],
                discovery: true
            }
        ]
    },
    {
        provider_name: "Dotsub",
        provider_url: "http://dotsub.com/",
        endpoints: [
            {
                schemes: ["http://dotsub.com/view/*"],
                url: "http://dotsub.com/services/oembed"
            }
        ]
    },
    {
        provider_name: "DTube",
        provider_url: "https://d.tube/",
        endpoints: [
            {
                schemes: ["https://d.tube/v/*"],
                url: "https://api.d.tube/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "edocr",
        provider_url: "http://www.edocr.com",
        endpoints: [
            {
                schemes: ["http://edocr.com/docs/*"],
                url: "http://edocr.com/api/oembed"
            }
        ]
    },
    {
        provider_name: "eduMedia",
        provider_url: "https://www.edumedia-sciences.com/",
        endpoints: [
            {
                url: "https://www.edumedia-sciences.com/oembed.json",
                discovery: true
            },
            {
                url: "https://www.edumedia-sciences.com/oembed.xml",
                discovery: true
            }
        ]
    },
    {
        provider_name: "EgliseInfo",
        provider_url: "http://egliseinfo.catholique.fr/",
        endpoints: [
            {
                schemes: ["http://egliseinfo.catholique.fr/*"],
                url: "http://egliseinfo.catholique.fr/api/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Embed Articles",
        provider_url: "http://embedarticles.com/",
        endpoints: [
            {
                schemes: ["http://embedarticles.com/*"],
                url: "http://embedarticles.com/oembed/"
            }
        ]
    },
    {
        provider_name: "Embedly",
        provider_url: "http://api.embed.ly/",
        endpoints: [
            {
                url: "http://api.embed.ly/1/oembed"
            }
        ]
    },
    {
        provider_name: "Ethfiddle",
        provider_url: "https://www.ethfiddle.com/",
        endpoints: [
            {
                schemes: ["https://ethfiddle.com/*"],
                url: "https://ethfiddle.com/services/oembed/",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Eyrie",
        provider_url: "https://eyrie.io/",
        endpoints: [
            {
                schemes: ["https://eyrie.io/board/*", "https://eyrie.io/sparkfun/*"],
                url: "https://eyrie.io/v1/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Facebook (Video)",
        provider_url: "https://www.facebook.com/",
        endpoints: [
            {
                schemes: [
                    "https://www.facebook.com/*/videos/*",
                    "https://www.facebook.com/video.php"
                ],
                url: "https://www.facebook.com/plugins/video/oembed.json",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Faithlife TV",
        provider_url: "https://faithlifetv.com",
        endpoints: [
            {
                schemes: [
                    "https://faithlifetv.com/items/*",
                    "https://faithlifetv.com/items/resource/*/*",
                    "https://faithlifetv.com/media/*",
                    "https://faithlifetv.com/media/assets/*",
                    "https://faithlifetv.com/media/resource/*/*"
                ],
                url: "https://faithlifetv.com/api/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Flat",
        provider_url: "https://flat.io",
        endpoints: [
            {
                schemes: ["https://flat.io/score/*", "https://*.flat.io/score/*"],
                url: "https://flat.io/services/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Flickr",
        provider_url: "http://www.flickr.com/",
        endpoints: [
            {
                schemes: ["http://*.flickr.com/photos/*", "http://flic.kr/p/*"],
                url: "http://www.flickr.com/services/oembed/",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Flourish",
        provider_url: "https://flourish.studio/",
        endpoints: [
            {
                schemes: [
                    "https://public.flourish.studio/visualisation/*",
                    "https://public.flourish.studio/story/*"
                ],
                url: "https://app.flourish.studio/api/v1/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "FOX SPORTS Australia",
        provider_url: "http://www.foxsports.com.au",
        endpoints: [
            {
                schemes: [
                    "http://fiso.foxsports.com.au/isomorphic-widget/*",
                    "https://fiso.foxsports.com.au/isomorphic-widget/*"
                ],
                url: "https://fiso.foxsports.com.au/oembed"
            }
        ]
    },
    {
        provider_name: "FrameBuzz",
        provider_url: "https://framebuzz.com/",
        endpoints: [
            {
                schemes: ["http://framebuzz.com/v/*", "https://framebuzz.com/v/*"],
                url: "https://framebuzz.com/oembed/",
                discovery: true
            }
        ]
    },
    {
        provider_name: "FunnyOrDie",
        provider_url: "http://www.funnyordie.com/",
        endpoints: [
            {
                schemes: ["http://www.funnyordie.com/videos/*"],
                url: "http://www.funnyordie.com/oembed.json"
            }
        ]
    },
    {
        provider_name: "Geograph Britain and Ireland",
        provider_url: "https://www.geograph.org.uk/",
        endpoints: [
            {
                schemes: [
                    "http://*.geograph.org.uk/*",
                    "http://*.geograph.co.uk/*",
                    "http://*.geograph.ie/*",
                    "http://*.wikimedia.org/*_geograph.org.uk_*"
                ],
                url: "http://api.geograph.org.uk/api/oembed"
            }
        ]
    },
    {
        provider_name: "Geograph Channel Islands",
        provider_url: "http://channel-islands.geograph.org/",
        endpoints: [
            {
                schemes: [
                    "http://*.geograph.org.gg/*",
                    "http://*.geograph.org.je/*",
                    "http://channel-islands.geograph.org/*",
                    "http://channel-islands.geographs.org/*",
                    "http://*.channel.geographs.org/*"
                ],
                url: "http://www.geograph.org.gg/api/oembed"
            }
        ]
    },
    {
        provider_name: "Geograph Germany",
        provider_url: "http://geo-en.hlipp.de/",
        endpoints: [
            {
                schemes: [
                    "http://geo-en.hlipp.de/*",
                    "http://geo.hlipp.de/*",
                    "http://germany.geograph.org/*"
                ],
                url: "http://geo.hlipp.de/restapi.php/api/oembed"
            }
        ]
    },
    {
        provider_name: "Getty Images",
        provider_url: "http://www.gettyimages.com/",
        endpoints: [
            {
                schemes: ["http://gty.im/*"],
                url: "http://embed.gettyimages.com/oembed",
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "Gfycat",
        provider_url: "https://gfycat.com/",
        endpoints: [
            {
                schemes: [
                    "http://gfycat.com/*",
                    "http://www.gfycat.com/*",
                    "https://gfycat.com/*",
                    "https://www.gfycat.com/*"
                ],
                url: "https://api.gfycat.com/v1/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "GIPHY",
        provider_url: "https://giphy.com",
        endpoints: [
            {
                schemes: [
                    "https://giphy.com/gifs/*",
                    "http://gph.is/*",
                    "https://media.giphy.com/media/*/giphy.gif"
                ],
                url: "https://giphy.com/services/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "GloriaTV",
        provider_url: "https://gloria.tv/",
        endpoints: [
            {
                url: "https://gloria.tv/oembed/",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Gyazo",
        provider_url: "https://gyazo.com",
        endpoints: [
            {
                schemes: ["https://gyazo.com/*"],
                url: "https://api.gyazo.com/api/oembed",
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "HuffDuffer",
        provider_url: "http://huffduffer.com",
        endpoints: [
            {
                schemes: ["http://huffduffer.com/*/*"],
                url: "http://huffduffer.com/oembed"
            }
        ]
    },
    {
        provider_name: "Hulu",
        provider_url: "http://www.hulu.com/",
        endpoints: [
            {
                schemes: ["http://www.hulu.com/watch/*"],
                url: "http://www.hulu.com/api/oembed.json"
            }
        ]
    },
    {
        provider_name: "iFixit",
        provider_url: "http://www.iFixit.com",
        endpoints: [
            {
                schemes: ["http://www.ifixit.com/Guide/View/*"],
                url: "http://www.ifixit.com/Embed"
            }
        ]
    },
    {
        provider_name: "IFTTT",
        provider_url: "http://www.ifttt.com/",
        endpoints: [
            {
                schemes: ["http://ifttt.com/recipes/*"],
                url: "http://www.ifttt.com/oembed/",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Indaco",
        provider_url: "https://player.indacolive.com/",
        endpoints: [
            {
                schemes: ["https://player.indacolive.com/player/jwp/clients/*"],
                url: "https://player.indacolive.com/services/oembed",
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "Infogram",
        provider_url: "https://infogr.am/",
        endpoints: [
            {
                schemes: ["https://infogr.am/*"],
                url: "https://infogr.am/oembed"
            }
        ]
    },
    {
        provider_name: "Infoveave",
        provider_url: "https://infoveave.net/",
        endpoints: [
            {
                schemes: ["https://*.infoveave.net/E/*", "https://*.infoveave.net/P/*"],
                url: "https://infoveave.net/services/oembed/",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Inoreader",
        provider_url: "https://www.inoreader.com",
        endpoints: [
            {
                schemes: ["https://www.inoreader.com/oembed/"],
                url: "https://www.inoreader.com/oembed/api/",
                discovery: true
            }
        ]
    },
    {
        provider_name: "inphood",
        provider_url: "http://inphood.com/",
        endpoints: [
            {
                schemes: ["http://*.inphood.com/*"],
                url: "http://api.inphood.com/oembed",
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "Instagram",
        provider_url: "https://instagram.com",
        endpoints: [
            {
                schemes: [
                    "http://instagram.com/p/*",
                    "http://instagr.am/p/*",
                    "http://www.instagram.com/p/*",
                    "http://www.instagr.am/p/*",
                    "https://instagram.com/p/*",
                    "https://instagr.am/p/*",
                    "https://www.instagram.com/p/*",
                    "https://www.instagr.am/p/*"
                ],
                url: "https://api.instagram.com/oembed",
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "iSnare Articles",
        provider_url: "https://www.isnare.com/",
        endpoints: [
            {
                schemes: ["https://www.isnare.com/*"],
                url: "https://www.isnare.com/oembed/"
            }
        ]
    },
    {
        provider_name: "ivlismusic",
        provider_url: "https://music.ivlis.kr/",
        endpoints: [
            {
                url: "https://music.ivlis.kr/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Kickstarter",
        provider_url: "http://www.kickstarter.com",
        endpoints: [
            {
                schemes: ["http://www.kickstarter.com/projects/*"],
                url: "http://www.kickstarter.com/services/oembed"
            }
        ]
    },
    {
        provider_name: "Kidoju",
        provider_url: "https://www.kidoju.com/",
        endpoints: [
            {
                schemes: ["https://www.kidoju.com/en/x/*/*", "https://www.kidoju.com/fr/x/*/*"],
                url: "https://www.kidoju.com/api/oembed"
            }
        ]
    },
    {
        provider_name: "Kit",
        provider_url: "https://kit.com/",
        endpoints: [
            {
                schemes: ["http://kit.com/*/*", "https://kit.com/*/*"],
                url: "https://embed.kit.com/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Kitchenbowl",
        provider_url: "http://www.kitchenbowl.com",
        endpoints: [
            {
                schemes: ["http://www.kitchenbowl.com/recipe/*"],
                url: "http://www.kitchenbowl.com/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Knacki",
        provider_url: "http://jdr.knacki.info",
        endpoints: [
            {
                schemes: ["http://jdr.knacki.info/meuh/*", "https://jdr.knacki.info/meuh/*"],
                url: "https://jdr.knacki.info/oembed"
            }
        ]
    },
    {
        provider_name: "LearningApps.org",
        provider_url: "http://learningapps.org/",
        endpoints: [
            {
                schemes: ["http://learningapps.org/*"],
                url: "http://learningapps.org/oembed.php",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Ludus",
        provider_url: "https://ludus.one",
        endpoints: [
            {
                schemes: ["https://app.ludus.one/*"],
                url: "https://app.ludus.one/oembed",
                discovery: true,
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "MathEmbed",
        provider_url: "http://mathembed.com",
        endpoints: [
            {
                schemes: [
                    "http://mathembed.com/latex?inputText=*",
                    "http://mathembed.com/latex?inputText=*"
                ],
                url: "http://mathembed.com/oembed"
            }
        ]
    },
    {
        provider_name: "me.me",
        provider_url: "https://me.me/",
        endpoints: [
            {
                schemes: ["https://me.me/i/*"],
                url: "https://me.me/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Meetup",
        provider_url: "http://www.meetup.com",
        endpoints: [
            {
                schemes: [
                    "http://meetup.com/*",
                    "https://www.meetup.com/*",
                    "https://meetup.com/*",
                    "http://meetu.ps/*"
                ],
                url: "https://api.meetup.com/oembed",
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "MixCloud",
        provider_url: "http://mixcloud.com/",
        endpoints: [
            {
                schemes: ["http://www.mixcloud.com/*/*/"],
                url: "http://www.mixcloud.com/oembed/"
            }
        ]
    },
    {
        provider_name: "Moby Picture",
        provider_url: "http://www.mobypicture.com",
        endpoints: [
            {
                schemes: ["http://www.mobypicture.com/user/*/view/*", "http://moby.to/*"],
                url: "http://api.mobypicture.com/oEmbed"
            }
        ]
    },
    {
        provider_name: "Modelo",
        provider_url: "http://modelo.io/",
        endpoints: [
            {
                schemes: ["https://beta.modelo.io/embedded/*"],
                url: "https://portal.modelo.io/oembed",
                discovery: false
            }
        ]
    },
    {
        provider_name: "MorphCast",
        provider_url: "https://www.morphcast.com",
        endpoints: [
            {
                schemes: ["https://m-roll.morphcast.com/mroll/*"],
                url: "https://m-roll.morphcast.com/service/oembed",
                discovery: true,
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "myBeweeg",
        provider_url: "https://mybeweeg.com",
        endpoints: [
            {
                schemes: ["https://mybeweeg.com/w/*"],
                url: "https://mybeweeg.com/services/oembed"
            }
        ]
    },
    {
        provider_name: "nanoo.tv",
        provider_url: "https://www.nanoo.tv/",
        endpoints: [
            {
                schemes: [
                    "http://*.nanoo.tv/link/*",
                    "http://nanoo.tv/link/*",
                    "http://*.nanoo.pro/link/*",
                    "http://nanoo.pro/link/*",
                    "https://*.nanoo.tv/link/*",
                    "https://nanoo.tv/link/*",
                    "https://*.nanoo.pro/link/*",
                    "https://nanoo.pro/link/*"
                ],
                url: "https://www.nanoo.tv/services/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Nasjonalbiblioteket",
        provider_url: "https://www.nb.no/",
        endpoints: [
            {
                url: "https://api.nb.no/catalog/v1/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "nfb.ca",
        provider_url: "http://www.nfb.ca/",
        endpoints: [
            {
                schemes: ["http://*.nfb.ca/film/*"],
                url: "http://www.nfb.ca/remote/services/oembed/",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Odds.com.au",
        provider_url: "https://www.odds.com.au",
        endpoints: [
            {
                schemes: ["https://www.odds.com.au/*", "https://odds.com.au/*"],
                url: "https://www.odds.com.au/api/oembed/"
            }
        ]
    },
    {
        provider_name: "Official FM",
        provider_url: "http://official.fm",
        endpoints: [
            {
                schemes: ["http://official.fm/tracks/*", "http://official.fm/playlists/*"],
                url: "http://official.fm/services/oembed.json"
            }
        ]
    },
    {
        provider_name: "On Aol",
        provider_url: "http://on.aol.com/",
        endpoints: [
            {
                schemes: ["http://on.aol.com/video/*"],
                url: "http://on.aol.com/api"
            }
        ]
    },
    {
        provider_name: "Ora TV",
        provider_url: "http://www.ora.tv/",
        endpoints: [
            {
                discovery: true,
                url: "https://www.ora.tv/oembed/*?format=json"
            }
        ]
    },
    {
        provider_name: "Orbitvu",
        provider_url: "https://orbitvu.co",
        endpoints: [
            {
                schemes: [
                    "https://orbitvu.co/001/*/ov3601/view",
                    "https://orbitvu.co/001/*/ov3601/*/view",
                    "https://orbitvu.co/001/*/ov3602/*/view",
                    "https://orbitvu.co/001/*/2/orbittour/*/view",
                    "https://orbitvu.co/001/*/1/2/orbittour/*/view",
                    "http://orbitvu.co/001/*/ov3601/view",
                    "http://orbitvu.co/001/*/ov3601/*/view",
                    "http://orbitvu.co/001/*/ov3602/*/view",
                    "http://orbitvu.co/001/*/2/orbittour/*/view",
                    "http://orbitvu.co/001/*/1/2/orbittour/*/view"
                ],
                url: "http://orbitvu.co/service/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Oumy",
        provider_url: "https://www.oumy.com/",
        endpoints: [
            {
                schemes: ["https://www.oumy.com/v/*"],
                url: "https://www.oumy.com/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Pastery",
        provider_url: "https://www.pastery.net",
        endpoints: [
            {
                schemes: [
                    "http://pastery.net/*",
                    "https://pastery.net/*",
                    "http://www.pastery.net/*",
                    "https://www.pastery.net/*"
                ],
                url: "https://www.pastery.net/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "PingVP",
        provider_url: "https://www.pingvp.com/",
        endpoints: [
            {
                url: "https://beta.pingvp.com.kpnis.nl/p/oembed.php",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Pixdor",
        provider_url: "http://www.pixdor.com/",
        endpoints: [
            {
                schemes: [
                    "https://store.pixdor.com/place-marker-widget/*/show",
                    "https://store.pixdor.com/map/*/show"
                ],
                url: "https://store.pixdor.com/oembed",
                formats: ["json", "xml"],
                discovery: true
            }
        ]
    },
    {
        provider_name: "Poll Daddy",
        provider_url: "http://polldaddy.com",
        endpoints: [
            {
                schemes: [
                    "http://*.polldaddy.com/s/*",
                    "http://*.polldaddy.com/poll/*",
                    "http://*.polldaddy.com/ratings/*"
                ],
                url: "http://polldaddy.com/oembed/"
            }
        ]
    },
    {
        provider_name: "Port",
        provider_url: "http://www.sellwithport.com/",
        endpoints: [
            {
                schemes: ["https://app.sellwithport.com/#/buyer/*"],
                url: "https://api.sellwithport.com/v1.0/buyer/oembed"
            }
        ]
    },
    {
        provider_name: "Portfolium",
        provider_url: "https://portfolium.com",
        endpoints: [
            {
                schemes: ["https://portfolium.com/entry/*"],
                url: "https://api.portfolium.com/oembed"
            }
        ]
    },
    {
        provider_name: "Punters",
        provider_url: "https://www.punters.com.au",
        endpoints: [
            {
                schemes: ["https://www.punters.com.au/*", "https://punters.com.au/*"],
                url: "https://www.punters.com.au/api/oembed/"
            }
        ]
    },
    {
        provider_name: "Quiz.biz",
        provider_url: "http://www.quiz.biz/",
        endpoints: [
            {
                schemes: ["http://www.quiz.biz/quizz-*.html"],
                url: "http://www.quiz.biz/api/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Quizz.biz",
        provider_url: "http://www.quizz.biz/",
        endpoints: [
            {
                schemes: ["http://www.quizz.biz/quizz-*.html"],
                url: "http://www.quizz.biz/api/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "RapidEngage",
        provider_url: "https://rapidengage.com",
        endpoints: [
            {
                schemes: ["https://rapidengage.com/s/*"],
                url: "https://rapidengage.com/api/oembed"
            }
        ]
    },
    {
        provider_name: "Reddit",
        provider_url: "https://reddit.com/",
        endpoints: [
            {
                schemes: [
                    "https://reddit.com/r/*/comments/*/*",
                    "https://www.reddit.com/r/*/comments/*/*"
                ],
                url: "https://www.reddit.com/oembed"
            }
        ]
    },
    {
        provider_name: "ReleaseWire",
        provider_url: "http://www.releasewire.com/",
        endpoints: [
            {
                schemes: ["http://rwire.com/*"],
                url: "http://publisher.releasewire.com/oembed/",
                discovery: true
            }
        ]
    },
    {
        provider_name: "RepubHub",
        provider_url: "http://repubhub.icopyright.net/",
        endpoints: [
            {
                schemes: ["http://repubhub.icopyright.net/freePost.act?*"],
                url: "http://repubhub.icopyright.net/oembed.act",
                discovery: true
            }
        ]
    },
    {
        provider_name: "ReverbNation",
        provider_url: "https://www.reverbnation.com/",
        endpoints: [
            {
                schemes: [
                    "https://www.reverbnation.com/*",
                    "https://www.reverbnation.com/*/songs/*"
                ],
                url: "https://www.reverbnation.com/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "RiffReporter",
        provider_url: "https://www.riffreporter.de/",
        endpoints: [
            {
                url: "https://www.riffreporter.de/service/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Roomshare",
        provider_url: "http://roomshare.jp",
        endpoints: [
            {
                schemes: ["http://roomshare.jp/post/*", "http://roomshare.jp/en/post/*"],
                url: "http://roomshare.jp/en/oembed.json"
            }
        ]
    },
    {
        provider_name: "RoosterTeeth",
        provider_url: "https://roosterteeth.com",
        endpoints: [
            {
                schemes: ["https://roosterteeth.com/*"],
                url: "https://roosterteeth.com/oembed",
                formats: ["json"],
                discovery: true
            }
        ]
    },
    {
        provider_name: "Rumble",
        provider_url: "https://rumble.com/",
        endpoints: [
            {
                url: "https://rumble.com/api/Media/oembed.json",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Sapo Videos",
        provider_url: "http://videos.sapo.pt",
        endpoints: [
            {
                schemes: ["http://videos.sapo.pt/*"],
                url: "http://videos.sapo.pt/oembed"
            }
        ]
    },
    {
        provider_name: "Screen9",
        provider_url: "http://www.screen9.com/",
        endpoints: [
            {
                schemes: ["https://console.screen9.com/*", "https://*.screen9.tv/*"],
                url: "https://api.screen9.com/oembed"
            }
        ]
    },
    {
        provider_name: "Screencast.com",
        provider_url: "http://www.screencast.com/",
        endpoints: [
            {
                url: "https://api.screencast.com/external/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Screenr",
        provider_url: "http://www.screenr.com/",
        endpoints: [
            {
                schemes: ["http://www.screenr.com/*/"],
                url: "http://www.screenr.com/api/oembed.json"
            }
        ]
    },
    {
        provider_name: "ScribbleMaps",
        provider_url: "https://scribblemaps.com",
        endpoints: [
            {
                schemes: [
                    "http://www.scribblemaps.com/maps/view/*",
                    "https://www.scribblemaps.com/maps/view/*",
                    "http://scribblemaps.com/maps/view/*",
                    "https://scribblemaps.com/maps/view/*"
                ],
                url: "https://scribblemaps.com/api/services/oembed.json",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Scribd",
        provider_url: "http://www.scribd.com/",
        endpoints: [
            {
                schemes: ["http://www.scribd.com/doc/*"],
                url: "http://www.scribd.com/services/oembed/"
            }
        ]
    },
    {
        provider_name: "ShortNote",
        provider_url: "https://www.shortnote.jp/",
        endpoints: [
            {
                schemes: ["https://www.shortnote.jp/view/notes/*"],
                url: "https://www.shortnote.jp/oembed/",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Shoudio",
        provider_url: "http://shoudio.com",
        endpoints: [
            {
                schemes: ["http://shoudio.com/*", "http://shoud.io/*"],
                url: "http://shoudio.com/api/oembed"
            }
        ]
    },
    {
        provider_name: "Show the Way, actionable location info",
        provider_url: "https://showtheway.io",
        endpoints: [
            {
                schemes: ["https://showtheway.io/to/*"],
                url: "https://showtheway.io/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Simplecast",
        provider_url: "https://simplecast.com",
        endpoints: [
            {
                schemes: ["https://simplecast.com/s/*"],
                url: "https://simplecast.com/oembed",
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "Sizzle",
        provider_url: "https://onsizzle.com/",
        endpoints: [
            {
                schemes: ["https://onsizzle.com/i/*"],
                url: "https://onsizzle.com/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Sketchfab",
        provider_url: "http://sketchfab.com",
        endpoints: [
            {
                schemes: [
                    "http://sketchfab.com/models/*",
                    "https://sketchfab.com/models/*",
                    "https://sketchfab.com/*/folders/*"
                ],
                url: "http://sketchfab.com/oembed",
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "SlideShare",
        provider_url: "http://www.slideshare.net/",
        endpoints: [
            {
                schemes: [
                    "http://www.slideshare.net/*/*",
                    "http://fr.slideshare.net/*/*",
                    "http://de.slideshare.net/*/*",
                    "http://es.slideshare.net/*/*",
                    "http://pt.slideshare.net/*/*"
                ],
                url: "http://www.slideshare.net/api/oembed/2",
                discovery: true
            }
        ]
    },
    {
        provider_name: "SmugMug",
        provider_url: "http://www.smugmug.com/",
        endpoints: [
            {
                schemes: ["http://*.smugmug.com/*"],
                url: "http://api.smugmug.com/services/oembed/",
                discovery: true
            }
        ]
    },
    {
        provider_name: "SocialExplorer",
        provider_url: "https://www.socialexplorer.com/",
        endpoints: [
            {
                schemes: [
                    "https://www.socialexplorer.com/*/explore",
                    "https://www.socialexplorer.com/*/view",
                    "https://www.socialexplorer.com/*/edit",
                    "https://www.socialexplorer.com/*/embed"
                ],
                url: "https://www.socialexplorer.com/services/oembed/",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Songlink",
        provider_url: "https://song.link",
        endpoints: [
            {
                schemes: ["https://song.link/*"],
                url: "https://song.link/oembed",
                formats: ["json"],
                discovery: true
            }
        ]
    },
    {
        provider_name: "SoundCloud",
        provider_url: "http://soundcloud.com/",
        endpoints: [
            {
                schemes: ["http://soundcloud.com/*", "https://soundcloud.com/*"],
                url: "https://soundcloud.com/oembed"
            }
        ]
    },
    {
        provider_name: "Soundsgood",
        provider_url: "https://soundsgood.co",
        endpoints: [
            {
                schemes: [
                    "https://play.soundsgood.co/playlist/*",
                    "https://soundsgood.co/playlist/*"
                ],
                url: "https://play.soundsgood.co/oembed",
                discovery: true,
                formats: ["json", "xml"]
            }
        ]
    },
    {
        provider_name: "SpeakerDeck",
        provider_url: "https://speakerdeck.com",
        endpoints: [
            {
                schemes: ["http://speakerdeck.com/*/*", "https://speakerdeck.com/*/*"],
                url: "https://speakerdeck.com/oembed.json",
                discovery: true,
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "Spotful",
        provider_url: "https://bespotful.com",
        endpoints: [
            {
                schemes: ["http://play.bespotful.com/*"],
                url: "https://api.bespotful.com/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Spotify",
        provider_url: "https://spotify.com/",
        endpoints: [
            {
                schemes: ["https://*.spotify.com/*", "spotify:*"],
                url: "https://embed.spotify.com/oembed/"
            }
        ]
    },
    {
        provider_name: "Spreaker",
        provider_url: "https://www.spreaker.com/",
        endpoints: [
            {
                schemes: ["http://*.spreaker.com/*", "https://*.spreaker.com/*"],
                url: "https://api.spreaker.com/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Streamable",
        provider_url: "https://streamable.com/",
        endpoints: [
            {
                schemes: ["http://streamable.com/*", "https://streamable.com/*"],
                url: "https://api.streamable.com/oembed.json",
                discovery: true
            }
        ]
    },
    {
        provider_name: "StreamOneCloud",
        provider_url: "https://www.streamone.nl",
        endpoints: [
            {
                schemes: ["https://content.streamonecloud.net/embed/*"],
                url: "https://content.streamonecloud.net/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Sutori",
        provider_url: "https://www.sutori.com/",
        endpoints: [
            {
                schemes: ["https://www.sutori.com/story/*"],
                url: "https://www.sutori.com/api/oembed",
                discovery: true,
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "Sway",
        provider_url: "https://www.sway.com",
        endpoints: [
            {
                schemes: ["https://sway.com/*", "https://www.sway.com/*"],
                url: "https://sway.com/api/v1.0/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Ted",
        provider_url: "http://ted.com",
        endpoints: [
            {
                schemes: ["http://ted.com/talks/*"],
                url: "http://www.ted.com/talks/oembed.json"
            }
        ]
    },
    {
        provider_name: "The New York Times",
        provider_url: "https://www.nytimes.com",
        endpoints: [
            {
                schemes: [
                    "https://www.nytimes.com/svc/oembed",
                    "https://nytimes.com/*",
                    "https://*.nytimes.com/*"
                ],
                url: "https://www.nytimes.com/svc/oembed/json/",
                discovery: true
            }
        ]
    },
    {
        provider_name: "They Said So",
        provider_url: "https://theysaidso.com/",
        endpoints: [
            {
                schemes: ["https://theysaidso.com/image/*"],
                url: "https://theysaidso.com/extensions/oembed/",
                discovery: true
            }
        ]
    },
    {
        provider_name: "TickCounter",
        provider_url: "https://www.tickcounter.com",
        endpoints: [
            {
                schemes: [
                    "http://www.tickcounter.com/countdown/*",
                    "http://www.tickcounter.com/countup/*",
                    "http://www.tickcounter.com/ticker/*",
                    "http://www.tickcounter.com/worldclock/*",
                    "https://www.tickcounter.com/countdown/*",
                    "https://www.tickcounter.com/countup/*",
                    "https://www.tickcounter.com/ticker/*",
                    "https://www.tickcounter.com/worldclock/*"
                ],
                url: "https://www.tickcounter.com/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Toornament",
        provider_url: "https://www.toornament.com/",
        endpoints: [
            {
                schemes: [
                    "https://www.toornament.com/tournaments/*/information",
                    "https://www.toornament.com/tournaments/*/registration/",
                    "https://www.toornament.com/tournaments/*/matches/schedule",
                    "https://www.toornament.com/tournaments/*/stages/*/"
                ],
                url: "https://widget.toornament.com/oembed",
                discovery: true,
                formats: ["json", "xml"]
            }
        ]
    },
    {
        provider_name: "Topy",
        provider_url: "http://www.topy.se/",
        endpoints: [
            {
                schemes: ["http://www.topy.se/image/*"],
                url: "http://www.topy.se/oembed/",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Twitch",
        provider_url: "https://www.twitch.tv",
        endpoints: [
            {
                schemes: [
                    "http://clips.twitch.tv/*",
                    "https://clips.twitch.tv/*",
                    "http://www.twitch.tv/*",
                    "https://www.twitch.tv/*",
                    "http://twitch.tv/*",
                    "https://twitch.tv/*"
                ],
                url: "https://api.twitch.tv/v4/oembed",
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "Twitter",
        provider_url: "http://www.twitter.com/",
        endpoints: [
            {
                schemes: ["https://twitter.com/*/status/*", "https://*.twitter.com/*/status/*"],
                url: "https://publish.twitter.com/oembed"
            }
        ]
    },
    {
        provider_name: "Ubideo",
        provider_url: "https://player.ubideo.com/",
        endpoints: [
            {
                schemes: ["https://player.ubideo.com/*"],
                url: "https://player.ubideo.com/api/oembed.json",
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "UOL",
        provider_url: "https://mais.uol.com.br/",
        endpoints: [
            {
                schemes: ["https://*.uol.com.br/view/*", "https://*.uol.com.br/video/*"],
                url: "https://mais.uol.com.br/apiuol/v3/oembed/view",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Ustream",
        provider_url: "http://www.ustream.tv",
        endpoints: [
            {
                schemes: ["http://*.ustream.tv/*", "http://*.ustream.com/*"],
                url: "http://www.ustream.tv/oembed",
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "Utposts",
        provider_url: "https://www.utposts.com/",
        endpoints: [
            {
                schemes: [
                    "https://www.utposts.com/products/*",
                    "http://www.utposts.com/products/*",
                    "https://utposts.com/products/*",
                    "http://utposts.com/products/*"
                ],
                url: "https://www.utposts.com/api/oembed",
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "Uttles",
        provider_url: "http://uttles.com",
        endpoints: [
            {
                schemes: ["http://uttles.com/uttle/*"],
                url: "http://uttles.com/api/reply/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "VeeR VR",
        provider_url: "http://veer.tv/",
        endpoints: [
            {
                schemes: ["http://veer.tv/videos/*"],
                url: "https://api.veer.tv/oembed",
                discovery: true
            },
            {
                schemes: ["http://veervr.tv/videos/*"],
                url: "https://api.veervr.tv/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Verse",
        provider_url: "http://verse.com/",
        endpoints: [
            {
                url: "http://verse.com/services/oembed/"
            }
        ]
    },
    {
        provider_name: "VEVO",
        provider_url: "http://www.vevo.com/",
        endpoints: [
            {
                schemes: ["http://www.vevo.com/*", "https://www.vevo.com/*"],
                url: "https://www.vevo.com/oembed",
                discovery: false
            }
        ]
    },
    {
        provider_name: "VideoJug",
        provider_url: "http://www.videojug.com",
        endpoints: [
            {
                schemes: ["http://www.videojug.com/film/*", "http://www.videojug.com/interview/*"],
                url: "http://www.videojug.com/oembed.json"
            }
        ]
    },
    {
        provider_name: "Vidlit",
        provider_url: "https://vidl.it/",
        endpoints: [
            {
                schemes: ["https://vidl.it/*"],
                url: "https://api.vidl.it/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Vidmizer",
        provider_url: "https://www.vidmizer.com/",
        endpoints: [
            {
                schemes: ["https://players.vidmizer.com/*"],
                url: "https://app-v2.vidmizer.com/api/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Vimeo",
        provider_url: "https://vimeo.com/",
        endpoints: [
            {
                schemes: [
                    "https://vimeo.com/*",
                    "https://vimeo.com/album/*/video/*",
                    "https://vimeo.com/channels/*/*",
                    "https://vimeo.com/groups/*/videos/*",
                    "https://vimeo.com/ondemand/*/*",
                    "https://player.vimeo.com/video/*"
                ],
                url: "https://vimeo.com/api/oembed.json",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Vlipsy",
        provider_url: "https://vlipsy.com/",
        endpoints: [
            {
                schemes: ["https://vlipsy.com/*"],
                url: "https://vlipsy.com/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "wecandeo",
        provider_url: "http://www.wecandeo.com/",
        endpoints: [
            {
                url: "http://play.wecandeo.com/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Wiredrive",
        provider_url: "https://www.wiredrive.com/",
        endpoints: [
            {
                schemes: ["https://*.wiredrive.com/*"],
                url: "http://*.wiredrive.com/present-oembed/",
                formats: ["json"],
                discovery: true
            }
        ]
    },
    {
        provider_name: "wizer.me",
        provider_url: "http://www.wizer.me/",
        endpoints: [
            {
                schemes: [
                    "http://*.wizer.me/learn/*",
                    "https://*.wizer.me/learn/*",
                    "http://*.wizer.me/preview/*",
                    "https://*.wizer.me/preview/*"
                ],
                url: "http://app.wizer.me/api/oembed.json",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Wootled",
        provider_url: "http://www.wootled.com/",
        endpoints: [
            {
                url: "http://www.wootled.com/oembed"
            }
        ]
    },
    {
        provider_name: "WordPress.com",
        provider_url: "http://wordpress.com/",
        endpoints: [
            {
                url: "http://public-api.wordpress.com/oembed/",
                discovery: true
            }
        ]
    },
    {
        provider_name: "Yes, I Know IT!",
        provider_url: "http://yesik.it",
        endpoints: [
            {
                schemes: ["http://yesik.it/*", "http://www.yesik.it/*"],
                url: "http://yesik.it/s/oembed",
                formats: ["json"],
                discovery: true
            }
        ]
    },
    {
        provider_name: "YFrog",
        provider_url: "http://yfrog.com/",
        endpoints: [
            {
                schemes: ["http://*.yfrog.com/*", "http://yfrog.us/*"],
                url: "http://www.yfrog.com/api/oembed",
                formats: ["json"]
            }
        ]
    },
    {
        provider_name: "YouTube",
        provider_url: "https://www.youtube.com/",
        endpoints: [
            {
                schemes: ["https?://youtu.be/*", "https?://www.youtube.com/*"],
                url: "https://www.youtube.com/oembed",
                discovery: true
            }
        ]
    },
    {
        provider_name: "ZnipeTV",
        provider_url: "https://www.znipe.tv/",
        endpoints: [
            {
                schemes: ["https://*.znipe.tv/*"],
                url: "https://api.znipe.tv/v3/oembed/",
                discovery: true
            }
        ]
    },
    {
        provider_name: "ZProvider",
        provider_url: "https://reports.zoho.com/",
        endpoints: [
            {
                schemes: [
                    "https://reports.zoho.com/ZDBDataSheetView.cc?OBJID=1432535000000003002&STANDALONE=true&INTERVAL=120&DATATYPESYMBOL=false&REMTOOLBAR=false&SEARCHBOX=true&INCLUDETITLE=true&INCLUDEDESC=true&SHOWHIDEOPT=true"
                ],
                url: "http://api.provider.com/oembed.json",
                discovery: true
            }
        ]
    }
];
