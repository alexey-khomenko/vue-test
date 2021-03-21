const ticker_handlers = new Map();
const queue = [];

const API_KEY = '364fdb45f6b9350786ecaf1cc257574446a0e173c309aeaf154397ace2ed25fc';
const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);

const AGGREGATE_INDEX = '5';

socket.addEventListener('message', (e) => {
    const {TYPE: type, FROMSYMBOL: currency, PRICE: new_price} = JSON.parse(e.data);

    if (type !== AGGREGATE_INDEX || new_price === undefined) return true;

    if (!ticker_handlers.has(currency)) return true;

    ticker_handlers.get(currency)(currency, new_price);
});

socket.addEventListener("open", () => {
    while (queue.length) {
        socket.send(queue.pop());
    }
});

function sendToWebSocket(message) {
    const json_message = JSON.stringify(message);

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(json_message);
    }
    {
        queue.push(json_message);
    }
}

function subscribeToTickerOnWs(ticker) {
    sendToWebSocket({
        action: "SubAdd",
        subs: [`5~CCCAGG~${ticker}~USD`]
    });
}

function unsubscribeFromTickerOnWs(ticker) {
    sendToWebSocket({
        action: "SubRemove",
        subs: [`5~CCCAGG~${ticker}~USD`]
    });
}

//----------------------------------------------------------------------------------------------------------------------
/*
const loadTickers = async () => {
    if (ticker_handlers.size === 0) {
        return;
    }

    const LINK = new URL('https://min-api.cryptocompare.com/data/pricemulti');
    LINK.searchParams.set('tsyms', 'USD');
    LINK.searchParams.set('fsyms', [...ticker_handlers.keys()].join(','));

    const f = await fetch(LINK.toString());
    const r = await f.json();

    for (let currency in r) {
        const new_price = r[currency]['USD'];

        if (!ticker_handlers.has(currency)) continue;

        ticker_handlers.get(currency)(new_price);
    }
};
setInterval(loadTickers, 5000);
*/
//----------------------------------------------------------------------------------------------------------------------
export const subscribeToTicker = (ticker, cb) => {
    ticker_handlers.set(ticker, cb);
    subscribeToTickerOnWs(ticker);
}

export const unsubscribeFromTicker = (ticker) => {
    ticker_handlers.delete(ticker);
    unsubscribeFromTickerOnWs(ticker);
}
//----------------------------------------------------------------------------------------------------------------------
export const loadCoins = async () => {
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

export const loadCurrencies = () => {
    const tickers = localStorage.getItem('cryptonomicon-list');
    return tickers ? JSON.parse(tickers) : [];
};

export const saveTickers = (tickers) => {
    localStorage.setItem('cryptonomicon-list', JSON.stringify(tickers));
};
//----------------------------------------------------------------------------------------------------------------------
export const loadFilter = () => {
    const window_data = Object.fromEntries(
        new URL(window.location).searchParams.entries()
    );

    return window_data.filter ?? '';
};

export const saveFilter = (f) => {
    window.history.pushState(
        null,
        document.title,
        `${window.location.pathname}?filter=${f}&page=${loadPage()}`
    );
};

export const loadPage = () => {
    const window_data = Object.fromEntries(
        new URL(window.location).searchParams.entries()
    );

    return window_data.page ?? 1;
};

export const savePage = (p) => {
    window.history.pushState(
        null,
        document.title,
        `${window.location.pathname}?filter=${loadFilter()}&page=${p}`
    );
};
//----------------------------------------------------------------------------------------------------------------------
let signer = false;
const self = Date.now();
const pages = [self];
const signer_timeout = setTimeout(runDataBroadcasting, 900);

//console.log("I am " + self);

function runDataBroadcasting() {
    signer = true;

    //console.log('I am signer!');
}

const data_channel = new BroadcastChannel('data');
data_channel.addEventListener('message', function (e) {
    console.log(e.data);
});

const lifecycle = new BroadcastChannel('lifecycle');

lifecycle.addEventListener('message', function (e) {
    clearTimeout(signer_timeout);

    const {mode, page} = e.data;

    switch (mode) {
        case 'new':
            pages.push(page);
            lifecycle.postMessage({mode: 'old', page: self});
            break;
        case 'old':
            if (pages.indexOf(page) === -1) pages.push(page);
            break;
        case 'die':
            if (pages.indexOf(page) > -1) pages.splice(pages.indexOf(page), 1);
            break;
    }

    pages.sort((a, b) => a - b);
    //console.log(pages);

    if (self !== pages[0] || signer) return true;

    runDataBroadcasting();
});

lifecycle.postMessage({mode: 'new', page: self});

window.addEventListener('unload', function () {
    lifecycle.postMessage({mode: 'die', page: self});
});