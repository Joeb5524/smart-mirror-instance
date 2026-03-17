let config = {
    address: "0.0.0.0",
    port: 8080,
    basePath: "/",
    ipWhitelist: [],

    useHttps: false,
    httpsPrivateKey: "",
    httpsCertificate: "",

    language: "en",
    locale: "en-US",

    logLevel: ["INFO", "LOG", "WARN", "ERROR"],
    timeFormat: 24,
    units: "metric",

    modules: [
        {
            module: "MMM-ThemeParkWaitTimes",
            header: "Thorpe Park",
            position: "top_center",
            config: {
                screens: ["home", "joe"],
                updateInterval: 10 * 60 * 1000, //optional - allows you to set how often to check for updates, in milliseconds - 10 minutes is the default
                hideClosedParks: true,
                park: {
                    entity: "b08d9272-d070-4580-9fcd-375270b191a7", //required - https://themeparks.wiki/browse/
                    rides: [
                        //https://api.themeparks.wiki/v1/entity/75ea578a-adc8-4116-a54d-dccb60765ef9/live  - use the "id" for each ride

                    ],
                },
            },
        },
        {
            module: "MMM-ThemeParkWaitTimes",
            header: "Efteling",
            position: "top_center",
            config: {
                screens: ["home", "joe"],
                updateInterval: 10 * 60 * 1000, //optional - allows you to set how often to check for updates, in milliseconds - 10 minutes is the default
                hideClosedParks: false,
                park: {
                    entity: "30713cf6-69a9-47c9-a505-52bb965f01be", //efteling  //required - https://themeparks.wiki/browse/
                    rides: [
                        //https://api.themeparks.wiki/v1/entity/75ea578a-adc8-4116-a54d-dccb60765ef9/live  - use the "id" for each ride

                    ],
                },
            },
        },
        {
            module: "MMM-AssistTouch",
            position: "fullscreen_above",
            config: {
                screens: ["home", "meds", "care"],
                startScreen: "home",
                showScreenIndicator: true,
                screenIndicatorPosition: "top_left",
                enableKeyboard: true,
            }
        },

        {
            module: "MMM-VoiceControl",
            position: "fullscreen_above",
            config: {
                screenTags: ["home", "meds", "care"],
                modelDir: "models/vosk-model-small-en-us-0.15",
                wakeWord: "mirror",
                commandWindowMs: 4000,
                device: "plughw:2,0",
                commands: [
                    "next screen",
                    "home screen",
                    "meds screen",
                    "care screen",
                    "joe screen",
                    "acknowledge alert",
                    "dismiss alert",
                    "medication taken",
                    "play calm music",
                    "play sleep music",
                    "play morning music",
                    "play exercise music",
                    "play music",
                    "stop music",
                    "pause music",
                    "lights on",
                    "lights off",
                    "toggle lights",
                    "set lights red",
                    "set lights green",
                    "set lights blue",
                    "set lights white"
                ]
            }
        },

        {
            module: "MMM-SimpleRemote",
            position: "fullscreen_above",
            config: {
                screenTags: ["home", "meds", "care"],
                basePath: "/mm-simple-remote",
                displaySeconds: 25,
                maxQueue: 25,
                showTimestamp: true,
                dismissOnTouch: true,
                hue:{
                    bridgeIp: "192.168.0.2",
                    userId: "Q-pmyBMjEW345syvySPTaHl4em5SGws5kYGPOKDp",
                    hueApplicationKey: "Q-pmyBMjEW345syvySPTaHl4em5SGws5kYGPOKDp",
                    apiVerison: "auto",
                    enabled: true
                }
            }
        },


        {
            module: "alert",
            config: {
                screenTags: ["home", "meds", "care"]
            }
        },

        {
            module: "updatenotification",
            position: "top_bar",
            config: {
                screenTags: ["home", "meds", "care"]
            }
        },


        {
            module: "MMM-MedicationReminder",
            position: "bottom_right",
            header: "Medication",
            config: {
                screenTags: ["meds"],
                medications: [{ name: "Fluoxetine", dosage: "20mg", time: "09:00" }],
                alertWindowMinutes: 15,
                missedGraceMinutes: 60,
                showRelative: true,
                maxItems: 6
            }
        },
        {
            module: "MMM-MusicTiles",
            position: "bottom_right",
            config: {
                screenTags: ["home"],
                maxTiles: 3,
                tileSizePx: 170,
                showTitle: false,
                defaultVolume: 0.7
            }
        },


        {
            module: "clock",
            position: "top_left",
            config: {
                screenTags: ["home"]
            }
        },


        {
            module: "weather",
            position: "top_right",
            config: {
                screenTags: ["home"],
                weatherProvider: "openmeteo",
                type: "current",
                lat: 52.4131915,
                lon: -4.0811541
            }
        },
        {
            module: "weather",
            position: "top_right",
            header: "Weather Forecast",
            config: {
                screenTags: ["home"],
                appendLocationNameToHeader: true,
                weatherProvider: "openmeteo",
                type: "forecast",
                lat: 52.4131915,
                lon: -4.0811541
            }
        },

        {
            module: "newsfeed",
            position: "bottom_bar",
            config: {
                screenTags: ["home"],
                feeds: [
                    {
                        title: "New York Times",
                        url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml"
                    }
                ],
                showSourceTitle: true,
                showPublishDate: true,
                broadcastNewsFeeds: true,
                broadcastNewsUpdates: true
            }
        },


        {
            module: "MMM-HueRoomStatus",
            position: "bottom_left",
            config: {
                screenTags: ["home", "care"],
                header: "Hue Lights",
                bridgeIp: "192.168.0.2",
                userId: "Q-pmyBMjEW345syvySPTaHl4em5SGws5kYGPOKDp",

                mode: "lights",
                refreshMs: 60000,

                colour: true,
                showOnlyOn: false,
                showUnreachable: true,
                hideNameContains: ["Test"],

                maxItems: 12,
                animationSpeed: 1000
            }
        }
    ]
};

if (typeof module !== "undefined") {
    module.exports = config;
}