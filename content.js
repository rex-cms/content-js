(function() {
  
  // Create local references to array methods we'll want to use later.
  var array = [];
  var slice = array.slice;
  
  document.addEventListener("DOMContentLoaded", function(event) {
    if (renderOnLoad.length) {
      renderOnLoad.forEach(function(view) {
        onRender(view[0], view[1]);
      });
      renderOnLoad = [];
    }
  });
  
  function isElementInViewport(el) {
    var rect = el.getBoundingClientRect();

    return rect.bottom > 0 &&
        rect.right > 0 &&
        rect.left < (window.innerWidth || document. documentElement.clientWidth) &&
        rect.top < (window.innerHeight || document. documentElement.clientHeight);
  }
  
  // Helper functions
  function extend(obj) {
    slice.call(arguments, 1).forEach(function(item) {
      for (var key in item) obj[key] = item[key];
    });
    return obj;
  };

  // Converts the target object to an array.
  function toArray( o ) {
    return Array.prototype.slice.call( o );
  }
  
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

        elementAddEventListener.call(root, eventName, handler.bind(views[id]), false);
        views[id].events.push({eventName: eventName, handler: handler.bind(views[id]), listener: listener, selector: selector});
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
          delegate(id, match[1], match[2], method);
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
  
  var views = {};
  var renderOnLoad = [];
  
  function getOrCreateView(id) {
    if (views[id]) return views[id];
    onRender(id, function(id) {});
    return views[id];
  }
  
  function onRender (id, handler) {
    var el = document.getElementById(id);
    views[id] = {
      id: id,
      el: el || null,
      render: handler,
      events: []
    };
    if (el) {
      handler.call(views[id], id)
      if (isElementInViewport(el)) {
        send('enter', id); 
        // if (views[id]['on:enter']) views[id]['on:enter'](id);
      }
    }
    else {
      renderOnLoad.push([id, handler]);  
    }
    views[id].render = handler;
  }
  
  function on (eventName, id, handler) {
    switch (eventName) {
      case "render":
       onRender(id, handler);
       break;
      default:
        var match = eventName.match(delegateEventSplitter);
        delegate(id, match[1], match[2], handler);
    }
    return window.Content;
  }
  
  function call (id, method, params) {
    return new Promise(function (resolve, reject) {
      if (views[id] && views[id][method]) {
        views[id][method].call(views[id], params);
        resolve(true);
      }
      else {
        reject('"' + id + '" does not have a "' + method + '" method');
      }
    });
  }
  
  // Send custom events
  function  dispatchEvent(el, type, data) {
    var event = document.createEvent("HTMLEvents", 1, 2);
    var bubble = true;
    if (type === 'enter' || type === 'exit') bubble = false;
    event.initEvent(type, bubble, true);
    extend(event, data);
    el.dispatchEvent(event);
  }
  
  function registerEvents (id, events) {
     delegateEvents(id, events);
     return window.Content;
  }
  
  // Pipe global event to an event listener on an element
  function pipe (eventName, id, handler) {
    var view = getOrCreateView(id);
    // Do we have a rendered element?
    if (view && view.el) {
      // TODO: make sure this only gets added once
      document.addEventListener(eventName, function(event) {
        handler.bind(view)(event)
        // dispatchEvent(view.el, eventName, event);
      });
    }
    return window.Content;
  }
  
  function send (eventName, id, data) {
    var view = {};
    if (!data && id && typeof id !== "string") {
      data = id;
      view.el = document;
    }
    else if (!id && !data) {
      view.el = document;
    }
    else {
      view = getOrCreateView(id);
    }
    // Do we have a rendered element?
    if (view && view.el) {
      dispatchEvent(view.el, eventName, data);
    }
    return window.Content;
  }
  
  // Public API
  window.Content = {
    on: on,
    call: call,
    registerEvents: registerEvents,
    send: send,
    pipe: pipe
  }
  
}())