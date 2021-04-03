let connected = false;
self.addEventListener('connect', (e) => {
    e.source.addEventListener('message', (ev) => {
        if (ev.data === 'start') {
            if (connected === false) {
                connected = true;

                const tickers_queue = ['BTC'];
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
                            self.dispatchEvent(new CustomEvent('interval', {
                                detail: {c: currency, n: new_price * price},
                            }));
                        }
                    }

                    if (btc_tickers.has(currency)) {

                        btc_tickers.set(currency, new_price);

                        new_price = new_price * btc_price;
                    }

                    self.dispatchEvent(new CustomEvent('interval', {
                        detail: {c: currency, n: new_price},
                    }));
                });

                socket.addEventListener('open', () => {
                    while (tickers_queue.length) {
                        sendToWebSocket({
                            action: 'SubAdd',
                            subs: [`${PREFIX}~${tickers_queue.pop()}~USD`],
                        });
                    }
                });

                self.addEventListener('sendToWebSocket', (e) => {
                    sendToWebSocket(e.detail);
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
        } else {
            const {mode, ticker} = ev.data;

            if (mode === 'subscribeToTicker') {
                if (ticker === 'BTC') return true;

                self.dispatchEvent(new CustomEvent('sendToWebSocket', {
                    detail: {
                        action: 'SubAdd',
                        subs: [`5~CCCAGG~${ticker}~USD`],
                    },
                }));
            }

            if (mode === 'unsubscribeFromTicker') {
                if (ticker === 'BTC') return true;

                self.dispatchEvent(new CustomEvent('sendToWebSocket', {
                    detail: {
                        action: 'SubRemove',
                        subs: [`5~CCCAGG~${ticker}~USD`],
                    },
                }));
            }
        }
    }, false);
    e.source.start();

    self.addEventListener('interval', function (ev) {
        e.source.postMessage(ev.detail);
    });
}, false);