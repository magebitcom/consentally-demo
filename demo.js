// The demo stores' one script (same origin, so ConsentAlly lets it run): the Add to shopping bag
// button sends an add_to_cart event the Google tag or the container picks up once consent allows
// it, and the table shows Google Consent Mode's four purposes as the page's dataLayer carries
// them: the default ConsentAlly sets, then each update. It only reads the dataLayer and never
// writes a consent command itself.
/* global window, document */
(function () {
  "use strict";
  var PURPOSES = ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"];
  var setup = document.body.getAttribute("data-setup");

  function find(name) {
    return document.querySelector('[data-demo="' + name + '"]');
  }

  var button = find("add-to-cart");
  var added = find("added");
  if (button) {
    button.addEventListener("click", function () {
      var item = {
        item_id: "beanie-dusty-blue",
        item_name: "Ribbed wool beanie",
        price: 38,
        quantity: 1,
      };
      window.dataLayer = window.dataLayer || [];
      if (setup === "gtag" && typeof window.gtag === "function") {
        window.gtag("event", "add_to_cart", { currency: "USD", value: 38, items: [item] });
      } else {
        window.dataLayer.push({ ecommerce: null });
        window.dataLayer.push({
          event: "add_to_cart",
          ecommerce: { currency: "USD", value: 38, items: [item] },
        });
      }
      if (added) added.textContent = "Added to your bag (add_to_cart sent to the dataLayer).";
    });
  }

  var body = find("state");
  var history = find("history");
  if (!body) return;

  // A consent command as gtag pushes it: an arguments object (or array) of
  // "consent", "default" or "update", then the purposes.
  function consentCommand(entry) {
    if (!entry || typeof entry !== "object" || typeof entry.length !== "number") return null;
    if (entry[0] !== "consent") return null;
    if (entry[1] !== "default" && entry[1] !== "update") return null;
    if (!entry[2] || typeof entry[2] !== "object") return null;
    return { kind: entry[1], values: entry[2] };
  }

  var seen = 0;
  var state = {};
  var steps = [];

  function render() {
    var rows = "";
    for (var i = 0; i < PURPOSES.length; i += 1) {
      var name = PURPOSES[i];
      var value = state[name] || "Waiting for the default";
      rows +=
        "<tr><td>" +
        name +
        '</td><td data-state="' +
        (state[name] || "none") +
        '">' +
        value +
        "</td></tr>";
    }
    body.innerHTML = rows;
    if (history)
      history.textContent = steps.length ? "Commands so far: " + steps.join(", then ") + "." : "";
  }

  function read() {
    var layer = window.dataLayer;
    if (!layer || typeof layer.length !== "number") return;
    var changed = false;
    for (; seen < layer.length; seen += 1) {
      var command = consentCommand(layer[seen]);
      if (!command) continue;
      changed = true;
      steps.push(command.kind);
      for (var i = 0; i < PURPOSES.length; i += 1) {
        var value = command.values[PURPOSES[i]];
        if (value === "granted" || value === "denied") state[PURPOSES[i]] = value;
      }
    }
    if (changed) render();
  }

  read();
  window.setInterval(read, 400);
})();
