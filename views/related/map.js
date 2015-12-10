function (doc) {
  function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }

  for (var key in doc) {
    if (doc.hasOwnProperty(key) && endsWith(key, 'Id')) {
      emit(doc._id, doc[key]);
      emit(doc[key], doc._id);
    }
  }
}
