function (doc) {
  function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }

  for (var key in doc) {
    if (doc.hasOwnProperty(key) && endsWith(key, 'Id')) {
      emit([key, doc.ObjectType], 1);
    }
  }
}
