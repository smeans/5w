function (doc) {
  if (('ObjectType' in doc) && (doc.ObjectType == 'Opportunity')) {
    emit(doc.CreatedDate, doc._id);
  }
}
