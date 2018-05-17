String.prototype.cat = function (s) {
  var ns = '' + this;

  if (s) {
    ns += s;

    for (var i = 1; i < arguments.length; i++) {
      ns += arguments[i];
    }
  }

  return ns;
};

String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length === 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash &= 0xffff; // Convert to 32bit integer
  }
  return hash;
};

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}

if (!Date.now) {
  Date.now = function now() {
    return new Date().getTime();
  };
}

Date.prototype.toCouchString = function () {
  return this.toISOString().replace(/\.\d\d\dZ/, '+00:00');
};

(function ($) {
    $.fn.notify5WView = function (event) {
        return this.each(function () {
            var vo = $(this).data('$5wview');
            if (vo && event in vo) {
              vo[event]();
            }
        });
    };
}(jQuery));

function qualifyURL(url) {
    if (!/^http[s]?\:/.test(url)) {
      url = 'http://' + url.split('/').join('/');
    }

    return url;
}

function isString(o) {
  return typeof o === 'string' || o instanceof String;
}

function docToBool(v) {
  return v && v != '0';
}

function docToString(v) {
  return v ? v : '';
}

function docToNum(v) {
  if (isNaN(v)) {
    return '';
  }
  else {
    if ((v === null) || (v === undefined)) {
      return '';
    }
  }
  return v;
}

function contentToString(el) {
  return el.innerText.trim();
}

function jsonToXML(o) {
  var doc = document.implementation.createDocument(null, 'doc');

  for (var k in o) {
    if (o.hasOwnProperty(k)) {
      var el = doc.createElementNS(null, k);
      el.appendChild(doc.createTextNode(o[k]));

      doc.documentElement.appendChild(el);
    }
  }

  var xs = new XMLSerializer();

  return xs.serializeToString(doc);
}

function nullForEmpty(o) {
  return isString(o) ? (!!o ? o : null) : o;
}

function contentToString(el) {
  return el.innerText.trim();
}

function titleCaseToHuman(s) {
  return s.replace(/([A-Z])/g, ' $1').trim()
}

function findString(s, a) {
  if (a === undefined) {
    return -1;
  }

  for (var i = 0; i < a.length; i++) {
    if (a[i] == s) {
      return i;
    }
  }

  return -1;
}

function getLocal(key, def_value) {
  var v = window.localStorage.getItem(key);
  if (v) {
    v = JSON.parse(v);
  } else {
    v = def_value;
  }

  return v;
}

function setLocal(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getMimeType(url) {
  var mimeMap = {'jpeg':'image/jpeg', 'jpg':'image/jpeg', 'png':'image/png'};

  var ext = url.substr(url.lastIndexOf('.')+1).toLowerCase();
  return mimeMap[ext];
}

function callAll(ol, fn, args) {
  for (var i = 0; i < ol.length; i++) {
    var o = ol[i];

    o && typeof(o[fn]) == 'function' && o[fn].apply(o, args);
  }
}

function callReturnAll(ol, fn, args) {
  var ra = [];

  for (var i = 0; i < ol.length; i++) {
    var o = ol[i];

    var r = o && typeof(o[fn]) == 'function' && o[fn].apply(o, args);
    if (r) {
      ra.push(r);
    }
  }

  return ra;
}

function callReturnFirst(ol, fn, args) {
  var ra = [];

  for (var i = 0; i < ol.length; i++) {
    var o = ol[i];

    var r = o && typeof(o[fn]) == 'function' && o[fn].apply(o, args);
    if (r) {
      return r;
    }
  }

  return undefined;
}

function getExtension(f) {
  var pc = f.split('.');

  return pc.length ? pc.pop() : '';
}

function toArray(llo) {
  return [].slice.call(llo);
}

function elideString(s, l) {
  if (s.length < l) {
    return s;
  }

  s = s.substr(0, l);
  return s.substr(0, s.search(/\s[^\s]*$/)) + '...';
}

function evalJsonTemplate(t, o) {
  if (t.constructor !== Array) {
  	return t;
  }

  if (t.length < 1) {
	  return undefined;
  }

  if (t.length == 1) {
  	return o[t[0]];
  }

  var op = '$all';
  if (t[0].indexOf('$') == 0) {
  	op = t[0];
    t = t.slice(1);
  }

  var ra = [];

  t.forEach(v => {
  	ra.push(evalJsonTemplate(v, o));
  });

  switch (op) {
  case '$first': {
  	return ra.reduce((a, c) => a || c);
  } break;

  case '$any': {
  	return ra.join('');
  }

  case '$elide': {
    var t = ra.join('');
    if (t.length < 70) {
      return t;
    }
    t = t.substr(0, 70);
    return t.substr(0, t.search(/\s[^\s]*$/)) + '...';
  }

  default:
  case '$all': {
  		var r = ra.reduce((a, c) => (a == undefined || c == undefined) ? undefined : a + c, '');
      return r == undefined ? '' : r;
    } break;
  }
}
