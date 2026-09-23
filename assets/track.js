/* Jubilee — the middle of the funnel.
 *
 * Cloudflare knows somebody arrived. Shopify knows somebody bought. Neither
 * knows about the bag that went into a basket and never reached a checkout,
 * because that happens here, in this browser, and is never sent anywhere.
 * This sends it — to our own server, and nowhere else.
 *
 * What it collects: which page, where the visit came from (the host only,
 * never the full URL — a referring URL can carry what somebody typed into a
 * search box), what went into the basket, and whether the visit reached the
 * checkout.
 *
 * What it does not collect: no cookie, no name, no email, no IP written down,
 * no third party, nothing sold to anybody. The visit id is a random string in
 * sessionStorage; it dies when the tab closes and means nothing tomorrow. Its
 * only job is to tie "added to cart" to "went to checkout" inside one visit.
 *
 * And it must never break the shop. Every call is wrapped, every failure is
 * silent, nothing blocks a click or a navigation. A shop that will not sell
 * because the analytics are down is a worse shop than one with no analytics.
 */
(function () {
  'use strict';

  var ENDPOINT = 'https://internal.jubileecoffeeandtea.com/api/events';
  var KEY = 'jct_vid';

  function visitId() {
    try {
      var v = sessionStorage.getItem(KEY);
      if (v) return v;
      v = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random())
        .replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32);
      sessionStorage.setItem(KEY, v);
      return v;
    } catch (e) {
      // Private browsing, storage disabled, an iframe with no access: the
      // shop still works, this visit is simply not joined up.
      return null;
    }
  }

  /* The host, not the URL. The server reduces it too, but a full referring
     URL can carry what somebody typed into a search box and there is no
     reason for it to leave this browser at all. */
  function referrerHost() {
    try {
      var r = document.referrer;
      if (!r) return '';
      var h = new URL(r).hostname.toLowerCase().replace(/^www\./, '');
      return h === location.hostname.replace(/^www\./, '') ? '' : h;
    } catch (e) { return ''; }
  }

  function send(name, data) {
    try {
      var vid = visitId();
      if (!vid) return;
      var body = JSON.stringify({
        visitId: vid,
        events: [Object.assign({
          name: name,
          visitId: vid,
          path: location.pathname,
          referrer: referrerHost()
        }, data || {})]
      });

      // sendBeacon survives the page being navigated away from, which is
      // exactly what happens on the click that matters most — the one that
      // leaves for the Shopify checkout.
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
      } else {
        fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: body, keepalive: true, mode: 'cors' }).catch(function () {});
      }
    } catch (e) { /* never break the shop */ }
  }

  window.jctTrack = send;
  /* Handed to the checkout so an order can be tied back to the visit that
     produced it — see routes/analytics.mjs, which reports how often it
     actually survives the trip. */
  window.jctVisitId = visitId;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { send('page_view'); });
  } else {
    send('page_view');
  }
})();
