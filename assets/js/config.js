const configuration = {
    settings: {
        autorepeat: false,
        timeout: 10 * 1000
    },
    notification: {
        timeout: 6000
    },
    db: {
        name: "last-update-of-db"
    },
    STEAM_API: {
        key: localStorage.getItem("STEAM_API_KEY") || null
    }
}