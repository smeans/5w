function (head, req) {
  provides('css', function () {
    css = '';

    while (row = getRow()) {
      css += 'li._5w_type_' + row.key + ' img {\n';
      css += '  width: 24px;\n';
      css += '  height: 24px;\n';
      css += '  background-image: url("' + row.value + '");\n';
      css += '  background-repeat: no-repeat;\n';
      css += '  vertical-align: middle;\n';

      css += '}\n';
    }

    return css;
  });
}
