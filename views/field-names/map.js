function (doc) {
  for (var key in doc) {
    if (doc.hasOwnProperty(key)) {
      emit(key, 1);
    }
  }
}
