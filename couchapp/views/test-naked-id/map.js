function (doc) {
  var arr = doc._id.split('_');
  if (arr.length > 1) {
    emit(arr[1], doc.ObjectType);
  }
}
