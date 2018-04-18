function (doc) {
  var ica = doc._id.split('_');

  if ('ObjectType' in doc && doc.ObjectType) {
    emit(doc.ObjectType, 1);
  }

  if ('allow_create' in doc) {
    for (var i = 0; i < doc.allow_create.length; i++) {
      emit(doc.allow_create[i], 0);
    }
  }
}
