function result(object, property) {
var value = object ? object[property] : undefined;
return typeof value === 'function' ? object[property]() : value;
};

// VIEW methods
// Caches a local reference to `Element.prototype` for faster access.
var ElementProto = (typeof Element !== 'undefined' && Element.prototype) || {};
// Cross-browser event listener shims
var elementAddEventListener = ElementProto.addEventListener || function(eventName, listener) {
return this.attachEvent('on' + eventName, listener);
}
var elementRemoveEventListener = ElementProto.removeEventListener || function(eventName, listener) {
return this.detachEvent('on' + eventName, listener);
}
// Cached regex to split keys for `delegate`.
var delegateEventSplitter = /^(\S+)\s*(.*)$/;

// Find the right `Element#matches` for IE>=9 and modern browsers.
var matchesSelector = ElementProto.matches ||
  ElementProto.webkitMatchesSelector ||
  ElementProto.mozMatchesSelector ||
  ElementProto.msMatchesSelector ||
  ElementProto.oMatchesSelector ||
  // Make our own `Element#matches` for IE8
  function(selector) {
    // Use querySelectorAll to find all elements matching the selector,
    // then check if the given element is included in that list.
    // Executing the query on the parentNode reduces the resulting nodeList,
    // (document doesn't have a parentNode).
    var nodeList = (this.parentNode || document).querySelectorAll(selector) || [];
    return ~indexOf(nodeList, this);
  };

// Make a event delegation handler for the given `eventName` and `selector`
// and attach it to the element of a view.
// If selector is empty, the listener will be bound to view element. If not, a
// new handler that will recursively traverse up the event target's DOM
// hierarchy looking for a node that matches the selector. If one is found,
// the event's `delegateTarget` property is set to it and the return the
// result of calling bound `listener` with the parameters given to the
// handler.
function delegate(id, eventName, selector, listener) {
  if (views[id] && views[id].el) {
    if (typeof selector === 'function') {
      listener = selector;
      selector = null;
    }

    var root = views[id].el;
    var handler = selector ? function (e) {
      var node = e.target || e.srcElement;
      for (; node && node != root; node = node.parentNode) {
        if (matchesSelector.call(node, selector)) {
          e.delegateTarget = node;
          listener(e);
        }
      }
    } : listener;

    elementAddEventListener.call(root, eventName, handler, false);
    views[id].events.push({eventName: eventName, handler: handler, listener: listener, selector: selector});
  }
}

// Set callbacks, where `this.events` is a hash of
//
// *{"event selector": "callback"}*
//
//     {
//       'mousedown .title':  'edit',
//       'click .button':     'save',
//       'click .open':       function(e) { ... }
//     }
//
// pairs. Callbacks will be bound to the view, with `this` set properly.
// Uses event delegation for efficiency.
// Omitting the selector binds the event to `this.el`.
function delegateEvents(id, events) {
  var view = getOrCreateView(id); //views[id];
  if (view && view.el) {
    if (!(events || (events = result(view, 'events')))) return view;
    undelegateEvents(id);
    for (var key in events) {
      var method = events[key];
      if (typeof method !== 'function') {
        if (view[events[key]]) {
          method = view[events[key]];
        }
        else {
          method = function() {};
        }
      }
      var match = key.match(delegateEventSplitter);
      delegate(id, match[1], match[2], method.bind(view));
    }
  }
}

// Remove a single delegated event. Either `eventName` or `selector` must
// be included, `selector` and `listener` are optional.
function undelegate(id, eventName, selector, listener) {
  var view = views[id];
  if (typeof selector === 'function') {
    listener = selector;
    selector = null;
  }

  if (view && view.el) {
    var handlers = view.events.slice();
    for (var i = 0, len = handlers.length; i < len; i++) {
      var item = handlers[i];

      var match = item.eventName === eventName &&
          (listener ? item.listener === listener : true) &&
          (selector ? item.selector === selector : true);

      if (!match) continue;

      elementRemoveEventListener.call(view.el, item.eventName, item.handler, false);
      view.events.splice(indexOf(handlers, item), 1);
    }
  }
}

// Remove all events created with `delegate` from `el`
function undelegateEvents(id) {
  var view = views[id];
  if (view && view.el) {
    for (var i = 0, len = view.events.length; i < len; i++) {
      var item = view.events[i];
      elementRemoveEventListener.call(view.el, item.eventName, item.handler, false);
    };
    view.events.length = 0;
  }
}