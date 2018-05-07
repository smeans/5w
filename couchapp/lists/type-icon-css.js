function (head, req) {
  provides('css', function () {
    css = '';

    while (row = getRow()) {
      css += '._5w_type_' + row.key + ' img._5w_type_icon, ';
      css += 'li._5w_type_' + row.key + ' img {\n';
      css += '  background-image: url("' + row.value + '");\n';
      css += '  background-repeat: no-repeat;\n';
      css += '  background-size: contain;\n';
      css += '}\n';
    }

    return css;
  });
}
