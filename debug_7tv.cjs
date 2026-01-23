const https = require('https');

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
            res.on('error', reject);
        });
    });
}

async function check() {
    try {
        console.log("Checking Global Emotes...");
        const globalData = await fetchUrl("https://7tv.io/v3/emote-sets/global");
        console.log("Global Emotes keys:", Object.keys(globalData));
        if (globalData.emotes) {
            console.log("Global emote sample:", globalData.emotes[0]);
        } else {
            console.log("No 'emotes' key in global data");
        }

        console.log("\nChecking User Emotes (pokerstaples - 44445592)...");
        const userData = await fetchUrl("https://7tv.io/v3/users/twitch/44445592");
        console.log("User Data keys:", Object.keys(userData));
        if (userData.emote_set) {
            console.log("userData.emote_set keys:", Object.keys(userData.emote_set));
            if (userData.emote_set.emotes) {
                console.log("userData.emote_set.emotes length:", userData.emote_set.emotes.length);
                console.log("User emote sample:", userData.emote_set.emotes[0]);
            }
        } else {
            console.log("userData.emote_set is missing");
        }

        if (userData.user) {
            console.log("userData.user exists");
        }

    } catch (e) {
        console.error(e);
    }
}

check();
