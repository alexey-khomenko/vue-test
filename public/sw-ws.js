let connected = false;
self.addEventListener('connect', (e) => {
    e.source.addEventListener('message', (ev) => {
        if (ev.data === 'start') {
            if (connected === false) {
                connected = true;

                const tickers_queue = [];

                const API_KEY = '364fdb45f6b9350786ecaf1cc257574446a0e173c309aeaf154397ace2ed25fc';
                const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);

                const AGGREGATE_INDEX = '5';

                socket.addEventListener('message', (e) => {
                    const {TYPE: type, FROMSYMBOL: currency, PRICE: new_price} = JSON.parse(e.data);

                    if (type !== AGGREGATE_INDEX || new_price === undefined) return true;

                    self.dispatchEvent(new CustomEvent('interval', {
                        detail: {c: currency, n: new_price},
                    }));
                });

                socket.addEventListener('open', () => {
                    while (tickers_queue.length) {
                        sendToWebSocket({
                            action: 'SubAdd',
                            subs: [`5~CCCAGG~${tickers_queue.pop()}~USD`],
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
                self.dispatchEvent(new CustomEvent('sendToWebSocket', {
                    detail: {
                        action: 'SubAdd',
                        subs: [`5~CCCAGG~${ticker}~USD`],
                    },
                }));
            }

            if (ev.data.mode === 'unsubscribeFromTicker') {
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