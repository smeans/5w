function (doc) {
  if (doc.IsActivity) {
    emit(doc.CreatedDate, doc.TargetId);
  }
}
