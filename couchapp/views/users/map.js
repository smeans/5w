function (doc) {
  if (doc.ObjectType == 'User' && doc.Email) {
    emit(doc.Email, null);
  }
}
