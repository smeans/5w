function (doc) {
  if (doc._id.indexOf('$5w_proto_') == 0 && doc.icon_url) {
    var ica = doc._id.split('_');
    emit(ica[2], doc.icon_url);
  }
}
