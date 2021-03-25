let connected = false;
self.addEventListener('connect', (e) => {
    e.source.addEventListener('message', (ev) => {
        console.log('ev.data', ev.data);

        if (ev.data === 'start') {
            if (connected === false) {
                e.source.postMessage('worker init');
                connected = true;
            } else {
                e.source.postMessage('worker already inited');
            }
        }
    }, false);
    e.source.start();
}, false);