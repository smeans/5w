function (doc) {
  if ('ObjectType' in doc) {
    emit(doc.ObjectType, 1);
  }
}
