let config = {
    address: "localhost",
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
            module: "MMM-AssistTouch",
            position: "fullscreen_above",
            config: {
                screens: ["home", "meds", "care"],
                startScreen: "home",
                showScreenIndicator: true,
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
                    "acknowledge alert",
                    "dismiss alert"
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
                dismissOnTouch: true
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