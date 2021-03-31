let ticker_handler;
const tickers = [];
//----------------------------------------------------------------------------------------------------------------------
export const setTickerCallback = (cb) => {
    ticker_handler = cb;

    worker.port.addEventListener('message', (e) => {
        const {c: currency, n: new_price} = e.data;
        ticker_handler(currency, new_price);
    }, false);
};

export const subscribeToTicker = (ticker) => {
    if (tickers.indexOf(ticker) > -1) return;
    tickers.push(ticker);
    worker.port.postMessage({mode: 'subscribeToTicker', ticker: ticker});
};

export const unsubscribeFromTicker = (ticker) => {
    if (tickers.indexOf(ticker) === -1) return;
    tickers.splice(tickers.indexOf(ticker), 1);
    worker.port.postMessage({mode: 'unsubscribeFromTicker', ticker: ticker});
};
//----------------------------------------------------------------------------------------------------------------------
const worker = new SharedWorker('sw-sp.js');
worker.port.start();
worker.port.postMessage('start');