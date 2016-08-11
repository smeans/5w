function (doc) {
  if (doc.IsActivity || (doc.ObjectType && doc.ObjectType.indexOf('$5w_') === 0)) {
    return;
  }

  var getType = function (id) {
    var idSplit = id.split('_');
    if (idSplit.length < 2) {
      return;
    }

    return idSplit[0];
  }

  var endsWith = function (str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }

  for (var key in doc) {
    if (doc.hasOwnProperty(key) && endsWith(key, 'Id')) {
      if (getType(doc[key])) {
        emit([doc._id, getType(doc[key])], 1);
      }
      if (getType(doc._id)) {
        emit([doc[key], getType(doc._id)], 1);
      }
    }
  }

  if ('$5w_related' in doc) {
    var ra= doc.$5w_related;

    for (var i = 0; i < ra.length; i++) {
      if (getType(ra[i])) {
        emit([doc._id, getType(ra[i])], 1);
      }
      if (getType(doc._id)) {
        emit([ra[i], getType(doc._id)], 1);
      }
    }
  }
}