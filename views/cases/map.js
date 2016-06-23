function (doc) {
  if (('ObjectType' in doc) && (doc.ObjectType == 'Case')) {
    emit(doc.CreatedDate, doc._id);
  }
}
