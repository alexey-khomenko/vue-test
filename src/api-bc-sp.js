let ticker_handler;
const tickers = [];
//----------------------------------------------------------------------------------------------------------------------
export const setTickerCallback = (cb) => {
    ticker_handler = cb;

    data_channel.addEventListener('message', function (e) {
        const {c: currency, n: new_price} = e.data;
        ticker_handler(currency, new_price);
    });
};

export const subscribeToTicker = (ticker) => {
    if (tickers.indexOf(ticker) > -1) return;
    tickers.push(ticker);
};

export const unsubscribeFromTicker = (ticker) => {
    if (tickers.indexOf(ticker) === -1) return;
    tickers.splice(tickers.indexOf(ticker), 1);
};
//----------------------------------------------------------------------------------------------------------------------
export const loadCoinsFromApi = async () => {
    const LINK = new URL('https://min-api.cryptocompare.com/data/all/coinlist');
    LINK.searchParams.set('summary', 'true');

    const f = await fetch(LINK.toString());
    const r = await f.json();

    if (!('Data' in r)) return;

    let result = [];
    for (let coin in r.Data) {
        result.push({name: r.Data[coin]['FullName'], symbol: r.Data[coin]['Symbol']});
    }

    return result;
};
//----------------------------------------------------------------------------------------------------------------------
let signer = false;
const self = Date.now();
const tabs = [self];
const signer_timeout = setTimeout(runDataBroadcasting, 900);
const data_channel = new BroadcastChannel('data_channel');
const lifecycle = new BroadcastChannel('lifecycle');
console.log(self);

lifecycle.addEventListener('message', function (e) {
    clearTimeout(signer_timeout);

    const {mode, tab} = e.data;

    switch (mode) {
        case 'new':
            tabs.push(tab);
            lifecycle.postMessage({mode: 'old', tab: self});
            break;
        case 'old':
            if (tabs.indexOf(tab) === -1) tabs.push(tab);
            break;
        case 'die':
            if (tabs.indexOf(tab) > -1) tabs.splice(tabs.indexOf(tab), 1);
            break;
    }

    tabs.sort((a, b) => a - b);
    console.log(tabs);

    if (self !== tabs[0] || signer) return true;

    runDataBroadcasting();
});

lifecycle.postMessage({mode: 'new', tab: self});

window.addEventListener('unload', function () {
    lifecycle.postMessage({mode: 'die', tab: self});
});

function runDataBroadcasting() {
    signer = true;
    console.log('runDataBroadcasting');

    const loadTickers = async () => {
        if (!tickers.length) {
            return;
        }

        const LINK = new URL('https://min-api.cryptocompare.com/data/pricemulti');
        LINK.searchParams.set('tsyms', 'USD');
        LINK.searchParams.set('fsyms', [...tickers].join(','));

        const f = await fetch(LINK.toString());
        const r = await f.json();

        for (let currency in r) {
            const new_price = r[currency]['USD'];

            if (tickers.indexOf(currency) === -1) continue;

            ticker_handler(currency, new_price);
            data_channel.postMessage({c: currency, n: new_price});
        }
    };
    setInterval(loadTickers, 5000);
}