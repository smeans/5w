function (doc) {
  if (('ObjectType' in doc) && doc._id.indexOf('$5w_') !== 0) {
    emit(doc._id, null);
  }
}
