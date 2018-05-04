function (doc) {
  var searchInfo = {"SEARCH":"INFO"};

  // Production steps of ECMA-262, Edition 5, 15.4.4.21
  // Reference: http://es5.github.io/#x15.4.4.21
  // https://tc39.github.io/ecma262/#sec-array.prototype.reduce
  if (!Array.prototype.reduce) {
  Object.defineProperty(Array.prototype, 'reduce', {
    value: function(callback /*, initialValue*/) {
      if (this === null) {
        throw new TypeError( 'Array.prototype.reduce ' +
          'called on null or undefined' );
      }
      if (typeof callback !== 'function') {
        throw new TypeError( callback +
          ' is not a function');
      }

      // 1. Let O be ? ToObject(this value).
      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // Steps 3, 4, 5, 6, 7
      var k = 0;
      var value;

      if (arguments.length >= 2) {
        value = arguments[1];
      } else {
        while (k < len && !(k in o)) {
          k++;
        }

        // 3. If len is 0 and initialValue is not present,
        //    throw a TypeError exception.
        if (k >= len) {
          throw new TypeError( 'Reduce of empty array ' +
            'with no initial value' );
        }
        value = o[k++];
      }

      // 8. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kPresent be ? HasProperty(O, Pk).
        // c. If kPresent is true, then
        //    i.  Let kValue be ? Get(O, Pk).
        //    ii. Let accumulator be ? Call(
        //          callbackfn, undefined,
        //          « accumulator, kValue, k, O »).
        if (k in o) {
          value = callback(value, o[k], k, o);
        }

        // d. Increase k by 1.
        k++;
      }

      // 9. Return accumulator.
      return value;
    }
  });
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

    for (var i = 0; i < t.length; i++) {
      var v = t[i];

      ra.push(evalJsonTemplate(v, o));
    };

    switch (op) {
    case '$first': {
      return ra.reduce(function (a, c) { return a || c; });
    } break;

    case '$any': {
      return ra.join('');
    }

    default:
    case '$all': {
        var r = ra.reduce(function (a, c) { return (a == undefined || c == undefined) ? undefined : a + c; }, '');
        return r == undefined ? '' : r;
      } break;
    }
  }

  function emitValue(v, l) {
    emit(v, l);
    var wa = v.trim().split(' ');
    wa.shift();
    for (var i = 0; i < wa.length; i++) {
      emit(wa[i].trim(), l);
    }
  }

  if (!doc.hasOwnProperty('ObjectType') || doc.IsDeleted) {
    return;
  }

  var tso = searchInfo[doc.ObjectType];

  if (!tso) {
    return;
  }

  var display_name = doc._id;
  if (tso.display_expression) {
    display_name = evalJsonTemplate(tso.display_expression, doc) || doc._id;
    if (display_name) {
      emitValue(display_name, display_name);
    }
  }

  if (tso.searchFields) {
    for (var i = 0; i < tso.searchFields.length; i++) {
      var v = doc[tso.searchFields[i]];

      if (v) {
        emitValue(v, display_name);
      }
    }
  }
}
