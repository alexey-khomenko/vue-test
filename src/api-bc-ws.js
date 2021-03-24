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

    document.dispatchEvent(new CustomEvent('subscribeToTickerOnWs', {
        detail: ticker,
    }));
};

export const unsubscribeFromTicker = (ticker) => {
    if (tickers.indexOf(ticker) === -1) return;
    tickers.splice(tickers.indexOf(ticker), 1);

    document.dispatchEvent(new CustomEvent('unsubscribeFromTickerOnWs', {
        detail: ticker,
    }));
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

    const tickers_queue = [...tickers];

    const API_KEY = '364fdb45f6b9350786ecaf1cc257574446a0e173c309aeaf154397ace2ed25fc';
    const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);

    const AGGREGATE_INDEX = '5';

    socket.addEventListener('message', (e) => {
        const {TYPE: type, FROMSYMBOL: currency, PRICE: new_price} = JSON.parse(e.data);

        if (type !== AGGREGATE_INDEX || new_price === undefined) return true;

        if (tickers.indexOf(currency) === -1) return true;

        ticker_handler(currency, new_price);
        data_channel.postMessage({c: currency, n: new_price});
    });

    socket.addEventListener('open', () => {
        while (tickers_queue.length) {
            sendToWebSocket({
                action: 'SubAdd',
                subs: [`5~CCCAGG~${tickers_queue.pop()}~USD`],
            });
        }
    });

    document.addEventListener('subscribeToTickerOnWs', function (e) {
        sendToWebSocket({
            action: 'SubAdd',
            subs: [`5~CCCAGG~${e.detail}~USD`],
        });
    });

    document.addEventListener('unsubscribeFromTickerOnWs', function (e) {
        sendToWebSocket({
            action: 'SubRemove',
            subs: [`5~CCCAGG~${e.detail}~USD`],
        });
    });

    function sendToWebSocket(message) {
        const json_message = JSON.stringify(message);

        if (socket.readyState === WebSocket.OPEN) {
            socket.send(json_message);
        } else {
            tickers_queue.push(json_message);
        }
    }
}