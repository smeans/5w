function (doc) {
  if (('ObjectType' in doc) && (doc.ObjectType == 'Opportunity') && !doc.IsDeleted) {
    emit(doc.CreatedDate, doc._id);
  }
}
