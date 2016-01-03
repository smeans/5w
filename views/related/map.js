function (doc) {
  if (doc.IsActivity || (doc.ObjectType && doc.ObjectType.indexOf('$5w_') === 0)) {
    return;
  }

  function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }

  for (var key in doc) {
    if (doc.hasOwnProperty(key) && endsWith(key, 'Id')) {
      emit(doc._id, doc[key]);
      emit(doc[key], doc._id);
    }
  }

  if ('$5w_related' in doc) {
    var ra= doc.$5w_related;

    for (var i = 0; i < ra.length; i++) {
      emit(doc._id, ra[i]);
      emit(ra[i], doc._id);
    }
  }
}
