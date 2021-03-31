import {createNanoEvents} from 'nanoevents';

const emitter = createNanoEvents();
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

                    emitter.emit('interval', currency, new_price);
                });

                socket.addEventListener('open', () => {
                    while (tickers_queue.length) {
                        sendToWebSocket({
                            action: 'SubAdd',
                            subs: [`5~CCCAGG~${tickers_queue.pop()}~USD`],
                        });
                    }
                });

                emitter.on('sendToWebSocket', (message) => {
                    sendToWebSocket(message);
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
                emitter.emit('sendToWebSocket', {
                    action: 'SubAdd',
                    subs: [`5~CCCAGG~${ticker}~USD`],
                });
            }

            if (ev.data.mode === 'unsubscribeFromTicker') {
                emitter.emit('sendToWebSocket', {
                    action: 'SubRemove',
                    subs: [`5~CCCAGG~${ticker}~USD`],
                });
            }
        }
    }, false);
    e.source.start();

    emitter.on('interval', (currency, new_price) => {
        e.source.postMessage({c: currency, n: new_price});
    });
}, false);