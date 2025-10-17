// Author:  FireT
// GitHub:: https://github.com/firetofficial
// Copyright (c) FireT 2025.
// Edit by: Htu12

(async function () {
    'use strict';

    function initBypass() {
        const open = XMLHttpRequest.prototype.open;
        const send = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function (method, url) {
            this._url = url;
            return open.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function () {
            this.addEventListener('load', function () {
                try {
                    if (this._url.includes("/v1/user/info")) {
                        let data = JSON.parse(this.responseText);

                        data.result.is_vip = true;
                        data.result.role = "vip";
                        data.result.vip_expires_at = Date.now() + 10 * 365 * 24 * 60 * 60 * 1000;
                        data.result.coin_balance = 234000;

                        Object.defineProperty(this, 'responseText', {
                            value: JSON.stringify(data)
                        });
                        Object.defineProperty(this, 'response', {
                            value: JSON.stringify(data)
                        });
                    }
                } catch (e) {
                    console.error("Error:", e);
                }
            });
            return send.apply(this, arguments);
        };
    }

    initBypass();

})();
