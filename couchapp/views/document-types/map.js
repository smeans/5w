function (doc) {
  if ('ObjectType' in doc && doc.ObjectType) {
    emit(doc.ObjectType, 1);
  }

  if ('allow_create' in doc) {
    if (doc._id.indexOf('$5w_proto_') == 0) {
      var ica = doc._id.split('_');
      emit(ica[2], 0);
    }

    for (var i = 0; i < doc.allow_create.length; i++) {
      emit(doc.allow_create[i], 0);
    }
  }
}
