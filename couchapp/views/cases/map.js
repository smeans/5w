function (doc) {
  if (('ObjectType' in doc) && (doc.ObjectType == 'Case') && !doc.IsDeleted) {
    emit(doc.CreatedDate, doc._id);
  }
}
