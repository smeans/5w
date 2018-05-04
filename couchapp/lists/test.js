function(head, req) {
    provides("html", function() {
        html = "<html><body><ol>\n";
        while (row = getRow()) {
            html += "<li>" + row.key + ":" + row.value + "</li>\n";
        }
        html += "</ol></body></html>";
        return html;
    });
}
