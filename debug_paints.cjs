const https = require('https');

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function checkPaints() {
    // Check a few known 7TV users who might have paints
    // Using popular streamers/7TV staff who likely have cosmetics
    const testUsers = [
        { name: 'hasanabi', id: '207813352' },
        { name: 'xqc', id: '71092938' },
        { name: 'mizkif', id: '94753024' }
    ];

    for (const user of testUsers) {
        console.log(`\n=== Checking ${user.name} (${user.id}) ===`);
        try {
            const data = await fetchUrl(`https://7tv.io/v3/users/twitch/${user.id}`);

            console.log("Top-level keys:", Object.keys(data));

            if (data.user) {
                console.log("data.user keys:", Object.keys(data.user));
                if (data.user.style) {
                    console.log("data.user.style:", JSON.stringify(data.user.style, null, 2));
                }
                if (data.user.cosmetics) {
                    console.log("data.user.cosmetics:", JSON.stringify(data.user.cosmetics, null, 2));
                }
            }

            if (data.style) {
                console.log("data.style:", JSON.stringify(data.style, null, 2));
            }

        } catch (e) {
            console.error(`Error for ${user.name}:`, e.message);
        }
    }
}

checkPaints();
