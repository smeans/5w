function (doc) {
  function typeFromId(id) {
    var i = id.lastIndexOf('_');

    return i > 0 ? id.substr(0, i) : null;
  }

  if (doc.IsActivity) {
    emit([doc.CreatedById, doc.CreatedDate], doc._id);
  }
}
