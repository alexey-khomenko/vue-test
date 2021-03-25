let ticker_handler;
const tickers = [];
//----------------------------------------------------------------------------------------------------------------------
export const setTickerCallback = (cb) => {
    ticker_handler = cb;
    console.log(ticker_handler);

    worker.port.addEventListener('message', (e) => {
        // const {c: currency, n: new_price} = e.data;
        // ticker_handler(currency, new_price);
        console.log(e.data);
    }, false);
};

export const subscribeToTicker = (ticker) => {
    if (tickers.indexOf(ticker) > -1) return;
    tickers.push(ticker);
    // console.log('subscribeToTicker');
    // worker.port.postMessage(tickers);
    worker.port.postMessage('start ' + Date.now());
    worker.port.postMessage('start');
};

export const unsubscribeFromTicker = (ticker) => {
    if (tickers.indexOf(ticker) === -1) return;
    tickers.splice(tickers.indexOf(ticker), 1);
    // console.log('unsubscribeFromTicker');
    // worker.port.postMessage(tickers);
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
const worker = new SharedWorker('sw.js');
worker.port.start();