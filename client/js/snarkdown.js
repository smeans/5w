(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.snarkdown = factory());
}(this, (function () {

var TAGS = {
    '': ['<em>','</em>'],
    _: ['<strong>','</strong>'],
    '~': ['<s>','</s>'],
    '\n': ['<br />'],
    ' ': ['<br />'],
    '-': ['<hr />']
};
function outdent(str) {
    return str.replace(RegExp('^' + (str.match(/^(\t| )+/) || '')[0], 'gm'), '');
}

function encodeAttr(str) {
    return (str + '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parse(md, prevLinks) {
    var tokenizer = /((?:^|\n+)(?:\n---+|\* \*(?: \*)+)\n)|(?:^``` *(\w*)\n([\s\S]*?)\n```$)|((?:(?:^|\n+)(?:\t|  {2,}).+)+\n*)|((?:(?:^|\n)([>*+-]|\d+\.)\s+.*)+)|(?:\!\[([^\]]*?)\]\(([^\)]+?)\))|(\[)|(\](?:\(([^\)]+?)\))?)|(?:(?:^|\n+)([^\s].*)\n(\-{3,}|={3,})(?:\n+|$))|(?:(?:^|\n+)(#{1,6})\s*(.+)(?:\n+|$))|(?:`([^`].*?)`)|(  \n\n*|\n{2,}|__|\*\*|[_*]|~~)|((?:^\|[^\n]+\n)+)/gm;
		var context = [];
		var out = '';
		var links = prevLinks || {};
		var last = 0;
		var chunk, prev, token, inner, t;

    function tag(token) {
        var desc = TAGS[token.replace(/\*/g, '_')[1] || ''], end = context[context.length - 1] == token;
        if (!desc)
            { return token; }
        if (!desc[1])
            { return desc[0]; }
        context[end ? 'pop' : 'push'](token);
        return desc[end | 0];
    }

    function flush() {
        var str = '';
        while (context.length)
            { str += tag(context[context.length - 1]); }
        return str;
    }

    function renderTable(md) {
        function renderRows(t, md, csa) {
            var html = '';
            var rows = md.trim().split('\n').forEach(function (row) {
                var cells = row.split('|');
                cells.shift();
                html += '<tr>';
                for (var i = 0;i < cells.length; i++) {
                    html += '<' + t + (csa ? csa[i] : '') + '>' + parse(cells[i], links) + '</' + t + '>';
                }
                html += '</tr>';
            });
            return html;
        }

        var tsa = md.split(/^((?:\|\:?-{3}\:?)+)$/m);
        var taa;
        var html = '';
        if (tsa.length > 1) {
            var head = tsa.shift();
            html += '<thead>' + renderRows('th', head) + '</thead>';
            var sep = tsa.shift();
            var sa = sep.split('|');
            sa.shift();
            taa = sa.map(function (sep) { return ' style="' + ({
                '--': '',
                ':-': 'text-align: left',
                '-:': 'text-align: right',
                '::': 'text-align: center'
            })[sep.charAt(0) + sep.slice(-1)] + '"'; });
        }
        html += '<tbody>' + renderRows('td', tsa.pop(), taa) + '</tbody>';
        return '<table class="snarkdown">' + html + '</table>';
    }

    md = md.replace(/^\[(.+?)\]:\s*(.+)$/gm, function (s, name, url) {
        links[name.toLowerCase()] = url;
        return '';
    }).replace(/^\n+/g, '');
    while (token = tokenizer.exec(md)) {
        prev = md.substring(last, token.index);
        last = tokenizer.lastIndex;
        chunk = token[0];
        if (prev.match(/[^\\](\\\\)*\\$/)) {} else if (token[3] || token[4]) {
            chunk = '<pre class="code ' + (token[4] ? 'poetry' : token[2].toLowerCase()) + '">' + outdent(encodeAttr(token[3] || token[4]).replace(/^\n+|\n+$/g, '')) + '</pre>';
        } else if (token[6]) {
            t = token[6];
            if (t.match(/\./)) {
                token[5] = token[5].replace(/^\d+/gm, '');
            }
            inner = parse(outdent(token[5].replace(/^\s*[>*+.-]/gm, '')));
            if (t === '>') {
              t = 'blockquote';
            } else {
                t = t.match(/\./) ? 'ol' : 'ul';
                inner = inner.replace(/^(.*)(\n|$)/gm, '<li>$1</li>');
            }
            chunk = '<' + t + '>' + inner + '</' + t + '>';
        } else if (token[8]) {
            chunk = "<img src=\"" + (encodeAttr(token[8])) + "\" alt=\"" + (encodeAttr(token[7])) + "\">";
        } else if (token[10]) {
            out = out.replace('<a>', ("<a href=\"" + (encodeAttr(token[11] || links[prev.toLowerCase()])) + "\">"));
            chunk = flush() + '</a>';
        } else if (token[9]) {
            chunk = '<a>';
        } else if (token[12] || token[14]) {
            t = 'h' + (token[14] ? token[14].length : token[13][0] === '=' ? 1 : 2);
            chunk = '<' + t + '>' + parse(token[12] || token[15], links) + '</' + t + '>';
        } else if (token[16]) {
            chunk = '<code>' + encodeAttr(token[16]) + '</code>';
        } else if (token[17] || token[1]) {
            chunk = tag(token[17] || '--');
        } else if (token[18]) {
            chunk = renderTable(token[18]);
        }
        out += prev;
        out += chunk;
    }
    return (out + md.substring(last) + flush()).trim();
}

return parse;

})));
//# sourceMappingURL=snarkdown.umd.js.map
