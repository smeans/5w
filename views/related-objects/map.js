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

  var isValidId = function (id) {
    if (typeof id != 'string') return false;
    if (id == 'null_null') return false;

    var idSplit = id.split('_');
    if (idSplit.length == 2) {
      return true;
    }

    return false;
  }

  if (!isValidId(doc._id)) {
    return;
  }

  for (var key in doc) {
    if (doc.hasOwnProperty(key)) {
      if (Array.isArray(doc[key])) {
        for (var i = 0; i < doc[key].length; i++) {
          var docId = doc[key][i];
          if (isValidId(docId)) {
            emit([doc._id, getType(docId)], {_id: docId});
            emit([docId, getType(doc._id)], {_id: doc._id});
          }
        }
      }
      else if (endsWith(key, 'Id')) {
        if (isValidId(doc[key])) {
          emit([doc._id, getType(doc[key])], {_id: doc[key]});
          emit([doc[key], getType(doc._id)], {_id: doc._id});
        }
      }
    }
  }

}