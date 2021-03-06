var domify = (function() {

    var div = document.createElement('div');
    // Setup
    div.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
    // Make sure that link elements get serialized correctly by innerHTML
    // This requires a wrapper element in IE
    var innerHTMLBug = !div.getElementsByTagName('link').length;
    div = undefined;

    /**
     * Wrap map from jquery.
     */

    var map = {
      legend: [1, '<fieldset>', '</fieldset>'],
      tr: [2, '<table><tbody>', '</tbody></table>'],
      col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
      // for script/link/style tags to work in IE6-8, you have to wrap
      // in a div with a non-whitespace character in front, ha!
      _default: innerHTMLBug ? [1, 'X<div>', '</div>'] : [0, '', '']
    };

    map.td =
    map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

    map.option =
    map.optgroup = [1, '<select multiple="multiple">', '</select>'];

    map.thead =
    map.tbody =
    map.colgroup =
    map.caption =
    map.tfoot = [1, '<table>', '</table>'];

    map.text =
    map.circle =
    map.ellipse =
    map.line =
    map.path =
    map.polygon =
    map.polyline =
    map.rect = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];

    /**
     * Parse `html` and return a DOM Node instance, which could be a TextNode,
     * HTML DOM Node of some kind (<div> for example), or a DocumentFragment
     * instance, depending on the contents of the `html` string.
     *
     * @api app.dom.parse(html) Create element from string
     *
     * @apiDescription
     * Parse a string into a HTML element. 
     *
     * @apiName domParse
     * @apiGroup DOM
     *
     * @apiParam {String} html The HTML string to parse.
     *
     * @apiExample Example:
     * var el = app.dom.parse('<h1>A new element</h1>');
     *
     * @apiSuccessExample Example of return:
     * {DOM node}
     */

    function parse(html, doc) {
      if ('string' != typeof html) throw new TypeError('String expected');

      // default to the global `document` object
      if (!doc) doc = document;

      // tag name
      var m = /<([\w:]+)/.exec(html);
      if (!m) return doc.createTextNode(html);

      html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

      var tag = m[1];

      // body support
      if (tag == 'body') {
        var el = doc.createElement('html');
        el.innerHTML = html;
        return el.removeChild(el.lastChild);
      }

      // wrap map
      var wrap = map[tag] || map._default;
      var depth = wrap[0];
      var prefix = wrap[1];
      var suffix = wrap[2];
      var el = doc.createElement('div');
      el.innerHTML = prefix + html + suffix;
      while (depth--) el = el.lastChild;

      // one element
      if (el.firstChild == el.lastChild) {
        return el.removeChild(el.firstChild);
      }

      // several elements
      var fragment = doc.createDocumentFragment();
      while (el.firstChild) {
        fragment.appendChild(el.removeChild(el.firstChild));
      }

      return fragment;
    }

    return {
      parse: parse
    }

  }());