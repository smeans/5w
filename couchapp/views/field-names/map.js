function (doc) {
  if ('ObjectType' in doc) {
    for (var key in doc) {
      if (doc.hasOwnProperty(key) && key.indexOf('_') != 0
          && key.indexOf('$5w') != 0) {
        emit(key, 1);
      }
    }
  }

  if (doc._id.indexOf('$5w_proto') == 0) {
    if ('fields' in doc) {
      for (var i = 0; i < doc.fields.length; i++) {
        emit(doc.fields[i], 0);
      }
    }
  }
}
