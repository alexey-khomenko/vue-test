import {createNanoEvents} from 'nanoevents';

let ticker_handler;
const tickers = [];
const emitter = createNanoEvents();
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

    emitter.emit('subscribeToTickerOnWs', ticker);
};

export const unsubscribeFromTicker = (ticker) => {
    if (tickers.indexOf(ticker) === -1) return;
    tickers.splice(tickers.indexOf(ticker), 1);

    emitter.emit('unsubscribeFromTickerOnWs', ticker);
};
//----------------------------------------------------------------------------------------------------------------------
let signer = false;
const self = Date.now();
const tabs = [self];
const signer_timeout = setTimeout(runDataBroadcasting, 900);
const data_channel = new BroadcastChannel('data_channel');
const lifecycle = new BroadcastChannel('lifecycle');
//console.log(self);

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
    //console.log(tabs);

    if (self !== tabs[0] || signer) return true;

    runDataBroadcasting();
});

lifecycle.postMessage({mode: 'new', tab: self});

window.addEventListener('unload', function () {
    lifecycle.postMessage({mode: 'die', tab: self});
});

function runDataBroadcasting() {
    signer = true;
    //console.log('runDataBroadcasting');

    const tickers_queue = ['BTC', ...tickers];
    const btc_tickers = new Map();
    let btc_price;

    const API_KEY = '364fdb45f6b9350786ecaf1cc257574446a0e173c309aeaf154397ace2ed25fc';
    const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);

    const PREFIX = '5~CCCAGG';
    const AGGREGATE_INDEX = '5';
    const INVALID_SUB = '500';

    socket.addEventListener('message', (e) => {
        let {TYPE: type, FROMSYMBOL: currency, PRICE: new_price} = JSON.parse(e.data);
        const {MESSAGE: msg, PARAMETER: param} = JSON.parse(e.data);

        if (type === INVALID_SUB) {
            let msg_ticker = param.slice(PREFIX.length + 1, param.lastIndexOf('~'));

            switch (msg) {
                case 'INVALID_SUB':
                    sendToWebSocket({
                        action: 'SubAdd',
                        subs: [`${PREFIX}~${msg_ticker}~BTC`],
                    });

                    if (!btc_tickers.has(msg_ticker)) btc_tickers.set(msg_ticker, 0);
                    break;
                case 'SUBSCRIPTION_UNRECOGNIZED':
                    sendToWebSocket({
                        action: 'SubRemove',
                        subs: [`${PREFIX}~${msg_ticker}~BTC`],
                    });

                    btc_tickers.delete(msg_ticker);
                    break;
            }
        }

        if (type !== AGGREGATE_INDEX || new_price === undefined) return true;

        if (currency === 'BTC') {

            btc_price = new_price;

            for (let [currency, price] of btc_tickers.entries()) {
                ticker_handler(currency, new_price * price);
                data_channel.postMessage({c: currency, n: new_price * price});
            }
        }

        if (tickers.indexOf(currency) === -1) return true;

        if (btc_tickers.has(currency)) {

            btc_tickers.set(currency, new_price);

            new_price = new_price * btc_price;
        }

        ticker_handler(currency, new_price);
        data_channel.postMessage({c: currency, n: new_price});
    });

    socket.addEventListener('open', () => {
        while (tickers_queue.length) {
            sendToWebSocket({
                action: 'SubAdd',
                subs: [`${PREFIX}~${tickers_queue.pop()}~USD`],
            });
        }
    });

    emitter.on('subscribeToTickerOnWs', (ticker) => {
        if (ticker === 'BTC') return true;

        sendToWebSocket({
            action: 'SubAdd',
            subs: [`${PREFIX}~${ticker}~USD`],
        });
    });

    emitter.on('unsubscribeFromTickerOnWs', (ticker) => {
        if (ticker === 'BTC') return true;

        sendToWebSocket({
            action: 'SubRemove',
            subs: [`${PREFIX}~${ticker}~USD`],
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