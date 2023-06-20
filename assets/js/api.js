function d(el) {
    let element = document.querySelector(el);
    return element;
}


const steam_api_key_input = document.querySelector("#cfg-steamapi-key");
let sak_init;

const { shell } = require('electron')
let notificationTimer;
let notificationConfig = {
    time: 6
}



if(!configuration.STEAM_API.key) {
    notification("Please update Steam API key\n <a href='https://steamcommunity.com/dev/apikey'>https://steamcommunity.com/dev/apikey</a>")
    shell.beep();
    updateLinks();
} else {
    configuration.STEAM_API.key = localStorage.getItem("STEAM_API_KEY");
    steam_api_key_input.value = configuration.STEAM_API.key;
    steam_api_key_input.disabled = true;

    let label = document.querySelector("#steam_api_key_label");
    if(label.classList.contains("error")) {
        label.classList.remove("error");
        label.classList.add("active");
    }
}




const steamidconvert = require('steamidconvert')(`${configuration.STEAM_API.key}`);
const steamstatic = require("steam-userinfo");
const axios = require("axios");
const fs = require("fs");

const market = require('steam-market-pricing');
const steaminventory = require('get-steam-inventory');
const https = require('https');
const request = require("request");
const { create } = require('domain');
const itemIDs = [];
let test;
let timeout_in

const autoRepeatCfg = d("#cfg-autorepeat-fail-req");
autoRepeatCfg.addEventListener("change", function() {
    configuration.settings.autorepeat = true;
    user.set();
});

const minStyleCfg = d("#cfg-min-style");
let style = 0;
minStyleCfg.addEventListener("change", function() {
    d(".min-size-filter").classList.toggle("min");
    if(style == 1) {
        d(".min-size-filter").innerHTML = '<i class="fa fa-th" aria-hidden="true"></i>';
        style = 0;
    } else {
        d(".min-size-filter").innerHTML = '<i class="fa fa-bars" aria-hidden="true"></i>';
        style = 1;
    }
    user.set();
});

class User {
    constructor() {
        this.get();
    }

    get() {
        const user = fs.readFileSync('./assets/user/user.json');
        const json = JSON.parse(user);
        if(json.length == 0) {
            this.set();
            return;
        }
        if(json[0].SETTINGS.autorepat) {
            d("#cfg-autorepeat-fail-req").checked = true;
            configuration.settings.autorepeat = true;
        }
        if(json[0].SETTINGS.minStyle) {
            d("#cfg-min-style").checked = true;
            d(".min-size-filter").classList.add("min")
            d(".min-size-filter").innerHTML = '<i class="fa fa-th" aria-hidden="true"></i>';
            
        }
    }

    set(config) {
        const user = fs.readFileSync("./assets/user/user.json");
        const json = JSON.parse(user);
        console.log(json)
        const db_update = localStorage.getItem(configuration.db.name);
        let date = null;
        try {
            date = json[0]?.CREATED_AT
        } catch {}
        json[0] = {
            STEAM_API_KEY: configuration.STEAM_API.key || "",
            CREATED_AT: date || new Date().toLocaleString(),
            DB: {
                LAST_UPDATE: db_update
            },
            SETTINGS: {
                autorepat: d("#cfg-autorepeat-fail-req").checked,
                minStyle: d("#cfg-min-style").checked
            }
        }
        fs.writeFileSync("./assets/user/user.json", JSON.stringify(json, null, "\t"), () => {
            console.log("DONE!");
        })
    }
}
const user = new User();




function updateLinks() {
    const a = document.querySelectorAll("a");
    a.forEach(a => {
        a.addEventListener("click", function(e) {
            e.preventDefault();
            let link = this.href;
            if(link == '#') return;
            shell.openExternal(link);
        })
    })
}

function notification(text) {
    let notifEl = document.querySelector("#notification");
    let p = document.querySelector("#notification p");
    let timer = document.querySelector("#notification .time");
    p.innerHTML = text;
    notifEl.classList.remove("hidden-animation");

    notificationTimer = setInterval(() => {
        let t = configuration.notification.timeout / 1000;
        notificationConfig.time--;
        timer.innerText = notificationConfig.time;
        if(notificationConfig.time == 0) {
            clearInterval(notificationTimer);
            notificationConfig.time = 6;
            notifEl.classList.add("hidden-animation");
            setTimeout(() => {
                timer.innerText = notificationConfig.time;
            }, 1000);
        }
    }, 1000);
}


const resetSAKBtn = document.querySelector("#reset-api-key");
resetSAKBtn.addEventListener("click", function() {
    configuration.STEAM_API.key = "";
    localStorage.removeItem("STEAM_API_KEY");
    steam_api_key_input.disabled = false;
    steam_api_key_input.value = "";

    notification("Please update Steam API key\n <a href='https://steamcommunity.com/dev/apikey'>https://steamcommunity.com/dev/apikey</a>")
    updateLinks();
});

steam_api_key_input.addEventListener("input", function() {
    if(!this.value.trim()) return;
    if(sak_init) clearTimeout(sak_init);

    if(!this.focus()) {
        localStorage.setItem("STEAM_API_KEY", this.value.trim());
        configuration.STEAM_API.key = localStorage.getItem("STEAM_API_KEY");

        steam_api_key_input.value = configuration.STEAM_API.key;
        steam_api_key_input.disabled = true;

        let label = document.querySelector("#steam_api_key_label");
        if(label.classList.contains("error")) {
            label.classList.remove("error");
            label.classList.add("active");
        }
        user.set();
    }
})

class Steam {
    constructor() {
        this.loadUsersList();
    }

    getPriceFromJSON() {
        const rawdata = fs.readFileSync('assets/prices/prices_v6.json');
        const prices = JSON.parse(rawdata);
        return prices;
    }

    create(config) {
        const path = document.querySelector("#price-list");
        const Element = document.createElement("div");
        Element.id = 'item';
        // console.log(config);
        Element.innerHTML = 
        `
        <div id="container">
            <span id="length">${config.amount || 1}</span>
            <img src="${config.icon_url}" alt="${config.name}">
        </div>
        <div id="content">
            <p style="color: #${config.style.color || "#fff"};">
                ${config.name}
            </p>
            <span id="price">- $</span>
        </div>
        `
        path.append(Element);
    }

    sortingByName() {
        console.log(`Sorting by name`)
    }

    quit() {
        let isCorrect = confirm("Do you really wanna close app?");
        if(isCorrect) window.close();
    }

    loadUsersList() {
        const rawdata = fs.readFileSync('./assets/userdata/users.json');
        let users;
        try {
            test = rawdata;
            users = JSON.parse(rawdata);
        } catch(e) {
            console.error(e);
            return;
        }
        // console.log(users);

        const path = document.querySelector("#accounts-history-container #list #container");
        path.innerHTML = '';
        if(!users) return;
        console.time('loading')
        for(let i = 0; i < users.length; i++) {
            const element = document.createElement("div");
            element.id = "item";
            element.setAttribute("data-id", users[i].steamid)
            element.innerHTML = 
            `
                <div id="index">${i+1}</div>
                <div id="username">${users[i].name}</div>
                <div id="steamid" title="double click">${users[i].steamid}</div>
                <div id="items">${users[i].items}</div>
                <div id="created-at">${users[i].createdAt}</div>
                <div id="time">${users[i].time} s.</div>
                <div id="appid">${users[i].appid}</div>
                <div id="price">${users[i].price}</div>
                <div id="retry"><i class="fa fa-refresh" aria-hidden="true"></i></div>
            `
            path.append(element);
        }
        console.timeEnd('loading')
        const retryBtns = document.querySelectorAll("#retry");
        retryBtns.forEach(btn => {
            btn.addEventListener("click", this.refreshData);
        })

        const profileBtns = document.querySelectorAll("#accounts-history-container #list #container #item #steamid");
        if(!profileBtns) return;
        profileBtns.forEach(button => {
            button.ondblclick = function() {
                let url = `https://steamcommunity.com/profiles/${this.innerText}`;
                shell.openExternal(url);
            }
        })
    }

    refreshData() {
        d("#main").classList.remove("hidden");
        d("#settings-page").classList.add("hidden");
        d("#accounts-history-container").classList.add("hidden");
    
        const steamid = this.parentElement.dataset.id;
        d("#user-id").value = steamid;
        d("#get-data").click();
    }

    getUserItems(steamid) {
        if(!steamid) return;
        const path = document.querySelector("#price-list");
        path.innerHTML = '';
        config.steamid = steamid;
        account.profile = null;
        prices.items = [];
        prices.itemsWithoutPrice = 0;
        itemIDs.splice(0, itemIDs.length);

        accountBalContext.innerText = '-';
        steamidContext.innerText = '-';
        itemsLengthContext.innerText = '-';
        itemsWithoutPriceContext.innerText = '-';

        steaminventory.getinventory(config.appid, steamid, '2').then(data => {
            // console.log(data);
            messageReqRes.innerHTML = "Loading user data...";
            requestTime();
            itemsLengthContext.innerText = data.items.length;
            steamidContext.innerText = config.steamid;
            account.profile = data;
            account.profile.items.forEach(item => {
                prices.items.push(item.market_hash_name);
            });
            getUsr(config.steamid);
            prices.request(config.appid);
            return data;
        }).catch(err => {
            // throw err;
            messageReqRes.innerHTML = `${err}`
            get.disabled = false;
            if(configuration.settings.autorepeat == true) {
                console.error('retry');
                if(timeout_in) clearTimeout(timeout_in);
                timeout_in = setTimeout(() => {
                    get.click();
                }, configuration.settings.timeout);
                messageReqRes.innerHTML = `${err}<br>Reboot after <b>${configuration.settings.timeout/1000}</b> s.`
            }
        });
    }
    
    addUser(config) {
        if(!config) return;
        const rawdata = fs.readFileSync('assets/userdata/users.json');
        const users = JSON.parse(rawdata);
        users.push(config);

        fs.writeFile('assets/userdata/users.json', JSON.stringify(users, null, '\t'), () => {});
        setTimeout(() => {
            steam.loadUsersList();
        }, 1000);
    }
}




class DB {
    async update() {
        const updateDataBtn = document.querySelector("#update-data")
        const url = 'https://prices.csgotrader.app/latest/prices_v6.json';
        const response = await axios.get(url);
        const result = JSON.stringify(response.data);
        fs.writeFile('assets/prices/prices_v6.json', result, () => {
            console.log('db updated!');
            updateDataBtn.querySelector("i").className = 'fa fa-database';
            updateDataBtn.classList.remove("active");
            localStorage.setItem(configuration.db.name, new Date().toLocaleString());

            let dateOfUpdTxt = document.querySelector("#database-updated");
            dateOfUpdTxt.innerText = localStorage.getItem(configuration.db.name);
            user.set();
        })
    }
}

const input = document.querySelector("#user-id");
const get = document.querySelector("#get-data");
const messageReqRes = document.querySelector("#message-request p");
const filterBar = document.querySelector("#price-list-filter");
const itemsLengthContext = document.querySelector("#items-length-content");
const steamidContext = document.querySelector("#user-steam-id-value");
const accountBalContext = document.querySelector("#user-inventory-price");
const itemsWithoutPriceContext = document.querySelector("#items-without-price");

let ms = 0;
let s  = 0;
const timerTxt = document.querySelector("#time-for-request");
let request_timeout = null;
function requestTime() {
    timerTxt.innerText = `${s}.${ms} s.`
    ms++;
    if(ms >= 10) {
        ms = 0;
        s++;
    }
    request_timeout = setTimeout(requestTime, 100);
}


// 76561199129085426

let priceCount = 0;

// IMPORTANT VARIABLES

const steam = new Steam();
const db =  new DB();

const config = {
    timeout: 3500,
    steamid: '',
    set: 'prepend',
    appid: 730
}
let data;
async function getUsr(id) {
    
    steamstatic.getUserInfo(id, async function(d, f) {
        data = await f;
    });

    await console.log(data);

    return data;
}
const prices = {
    json: steam.getPriceFromJSON(),
    request: async function(appid = config.appid) {
        console.time("GET");
        await market.getItemsPrices(config.appid, prices.items).then(items => prices.items.forEach(name => {
            // console.log(`${name}: ${(items[name].median_price) || prices.json[name]?.bitskins?.price || prices.json[name]?.steam?.last_90d}`);
            itemIDs.push({
                name: name,
                price: +items[name].median_price?.replace("$", "") || +prices.json[name]?.bitskins?.price || +prices.json[name]?.steam?.last_90d || '-'
            });
            if(!(items[name].median_price?.replace("$", "") || +prices.json[name]?.bitskins?.price || +prices.json[name]?.steam?.last_90d)) {
                prices.itemsWithoutPrice++;
            }
            priceCount += +items[name].median_price?.replace("$", "") || +prices.json[name]?.bitskins?.price || +prices.json[name]?.steam?.last_90d || 0;
        }));
        prices.inventory_prices.push({
            appid: appid,
            price: priceCount
        });
        accountBalContext.innerText = priceCount.toFixed() + " $";
        account.profile.items.forEach((skin, i) => {
            // console.log(skin)
            steam.create({
                icon_url: `https://community.cloudflare.steamstatic.com/economy/image/${skin.icon_url}/330x192`,
                name: skin.market_hash_name,
                amount: 1,
                style: {
                    color: skin.name_color
                },
            });
        });
        
        await console.log(data)
        await steam.addUser({
            steamid: config.steamid,
            name: data.response.players[0].personaname || "<NONE>",
            appid: appid,
            price: priceCount.toFixed() + " $",
            createdAt: new Date().toLocaleString(),
            time: `${(s < 9) ? '0' + s : s}.${ms}`,
            items: prices.items.length,
            itemsWithNoPrice: prices.itemsWithoutPrice
        });

        const pricesContext = document.querySelectorAll("#item #price");
        const pricesContextTitle = document.querySelectorAll("#item #content p");
        try {
            pricesContext.forEach((item, i) => {
                if(pricesContextTitle[i].innerText = itemIDs[i].name) {
                    item.innerText = itemIDs[i].price + " $";
                }
            });
        } catch(e) {
            console.warn(e);
        }
        messageReqRes.innerHTML = "";
        get.disabled = false;
        priceCount = 0;
        if(request_timeout) clearTimeout(request_timeout);

        steamidContext.innerText = config.steamid;
        itemsLengthContext.innerText = prices.items.length;
        itemsWithoutPriceContext.innerText = prices.itemsWithoutPrice;
        console.timeEnd("GET");
    },
    inventory_prices: [],
    items: [],
    itemsWithoutPrice: 0
}

const account = {
    profile: null
}


input.addEventListener("keyup", function(event) {
    let key = event.key;
    if(key == "Enter") get.click();
})

get.addEventListener("click", function() {
    messageReqRes.innerHTML = "Loading...";
    if(input.value.indexOf("https://steamcommunity.com/id/") > -1) {
        input.value = input.value.replace('https://steamcommunity.com/id/', '').replaceAll('/', '')
    }
    if(input.value.indexOf("https://steamcommunity.com/profiles/") > -1) {
        input.value = input.value.replace('https://steamcommunity.com/profiles/', '').replaceAll('/', '')
    }
    

    if(!(+input.value)) {
        steamidconvert.convertVanity(input.value, function(err, res) {
            input.value = res;
            if(!res) {
                notification("Please update Steam API key\n <a href='https://steamcommunity.com/dev/apikey'>https://steamcommunity.com/dev/apikey</a>")
                shell.beep();
                // location.reload();
                updateLinks();
                return;
            }
            steam.getUserItems(input.value);
        })
    } else {
        steam.getUserItems(input.value);
    }
    this.disabled = true;
});

const filtersAppIdBtn = document.querySelectorAll("#filters #item");
filtersAppIdBtn.forEach(appidBtn => {
    appidBtn.addEventListener("click", function() {
        const appid = this.dataset.category;
        let appidTitle = document.querySelector("#appid-text");
        config.appid = +appid;
        appidTitle.innerText = config.appid;
    });
});