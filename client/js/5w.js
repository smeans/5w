/*[
  <package name="5w">
]*/
(function () {
  /*[
    <class name="$5WObjectType">
      <slug>Act as parent object for all <code>$5WObject</code> instances. Correspond
        to the object prefix in document ids (e.g. in Account_001A000000582fnIAA
        the object type would be 'Account').</slug>
      <constructor>
        <slug>The constructor shouldn't be called directly as there is a singleton
          for each object type in the system.</slug>
  ]*/
  class $5WObjectType {
    static refresh() {
      var pp = $5w.fetchObjectRange("$5w_proto_");
      pp.done(function (data, textStatus, jqXHR) {
        $5WObjectType._protos = {};

        $.each(data.rows, function () {
          var type = this.id.split('_').pop();
          $5WObjectType._protos[type] = this.doc;
        });
      });

      return pp;
    };

    static getAllFieldNames() {
      var s = new Set();

      for (var key in $5WObjectType._protos) {
        $5WObjectType._protos[key].fields.forEach(fieldName => {
          s.add(fieldName);
        });
      };

      return Array.from(s.values());
    }

    static getAllTypeNames() {
      return Object.keys($5WObjectType._protos);
    }

    static rebuildSearchIndexView() {
      var mapFunction = "function(e){function r(e,r){emit(e,r);var t=e.trim().split(\" \");t.shift();for(var n=0;n<t.length;n++)emit(t[n].trim(),r)}if(Array.prototype.reduce||Object.defineProperty(Array.prototype,\"reduce\",{value:function(e){if(null===this)throw new TypeError(\"Array.prototype.reduce called on null or undefined\");if(\"function\"!=typeof e)throw new TypeError(e+\" is not a function\");var r,t=Object(this),n=t.length>>>0,i=0;if(arguments.length>=2)r=arguments[1];else{for(;i<n&&!(i in t);)i++;if(i>=n)throw new TypeError(\"Reduce of empty array with no initial value\");r=t[i++]}for(;i<n;)i in t&&(r=e(r,t[i],i,t)),i++;return r}}),e.hasOwnProperty(\"ObjectType\")&&!e.IsDeleted){var t={SEARCH:\"INFO\"}[e.ObjectType];if(t){var n=e._id;if(t.display_expression&&(n=function e(r,t){if(r.constructor!==Array)return r;if(!(r.length<1)){if(1==r.length)return t[r[0]];var n=\"$all\";0==r[0].indexOf(\"$\")&&(n=r[0],r=r.slice(1));for(var i=[],o=0;o<r.length;o++){var l=r[o];i.push(e(l,t))}switch(n){case\"$first\":return i.reduce(function(e,r){return e||r});case\"$any\":return i.join(\"\");case\"$elide\":return(r=i.join(\"\")).length<70?r:(r=r.substr(0,70)).substr(0,r.search(/\s[^\s]*$/))+\"...\";default:case\"$all\":var a=i.reduce(function(e,r){return null==e||null==r?void 0:e+r},\"\");return null==a?\"\":a}}}(t.display_expression,e)||e._id)&&r(n,n),r(e.ObjectType,n),t.searchFields)for(var i=0;i<t.searchFields.length;i++){var o=e[t.searchFields[i]];o&&r(o,n)}}}}";
      var designDoc = {
        "_id": "_design/5ws",
        "views": {
          "5wo_search": {}
        }
      };
      var siToken = "{SEARCH:\"INFO\"}";

      $5WObjectType.refresh().done(function () {
        var searchInfo = {};

        for (var typeName in $5WObjectType._protos) {
          var ot = $5WObjectType.getType(typeName);

          var typeSearchInfo = {typeName};
          typeSearchInfo.searchFields = ot.proto.fields.filter(fieldName => {
            var mdo = $5w._sms.getMetadata(typeName, fieldName);
            return mdo && mdo.includeinsearch;
          });
          typeSearchInfo.display_expression = ot.proto && ot.proto.display_expression;

          searchInfo[typeName] = typeSearchInfo;
        }

        designDoc.views['5wo_search']['map'] = mapFunction.replace(siToken, JSON.stringify(searchInfo));

        $.ajax({
          type: 'GET',
          url: $5w.dburl + '/' + designDoc._id,
        })
          .always(function (data) {
            if (data && data._rev) {
              designDoc._rev = data._rev;
            }

            return $.ajax({
                    type: 'PUT',
                    url: $5w.dburl + '/' + designDoc._id,
                    data: JSON.stringify(designDoc),
                    dataType: 'json',
                    error: function (jqXHR, textStatus, errorThrown) {
                      alert(textStatus + ': ' + errorThrown + '\n' + jqXHR.responseText);
                    }
                  });
          });
      });
    }

    constructor(type) {
      this.type = type;
    }

    save() {
      var _this = this;

      if (!_this.proto.hasOwnProperty('_id')) {
        _this.proto._id = '$5w_proto_' + this.type;
      }

      return $.ajax({
              type: 'PUT',
              url: $5w.dburl + '/' + _this.proto._id,
              data: JSON.stringify(_this.proto),
              dataType: 'json'
            })
            .done(function (data) {
              _this.proto._rev = data.rev;
              $5WObjectType.rebuildSearchIndexView();
            });
    }

    get fields() {
      return this.type in $5WObjectType._protos ? $5WObjectType._protos[this.type].fields : [];
    }

    set fields(newValue) {
      this.proto.fields = newValue;
    }

    get allow_create() {
      return this.type in $5WObjectType._protos ? $5WObjectType._protos[this.type].allow_create : [];
    }

    set allow_create(newValue) {
      this.proto.allow_create = newValue;
    }

    get proto() {
      if (!(this.type in $5WObjectType._protos)) {
        $5WObjectType._protos[this.type] = {fields: [], allow_create: []};
      }

      return  $5WObjectType._protos[this.type];
    }
  }

  $5WObjectType._types = {};
  $5WObjectType._protos = {};

  $5WObjectType.getType = function (type) {
    if (!(type in $5WObjectType._types)) {
      $5WObjectType._types[type] = new $5WObjectType(type);
    }

    return $5WObjectType._types[type];
  };

  $5WObjectType.makeNew = function (type) {
    if (!type) {
      return null;
    }
    var o = {};

    o._id = $5w.getNewId(type);
    o.ObjectType = type;
    o.CreatedDate = (new Date()).toCouchString();
    o.CreatedById = $5w.user_info.doc_id;

    return o;
  };

  $5WObjectType.prototype.isActivity = function () {
    return this.type.endsWith('Activity');
  };

  $5WObjectType.prototype.getProto = function () {
    return this.type in $5WObjectType._protos ? $5WObjectType._protos[this.type] : null;
  };

  $5WObjectType.prototype.displayName = function () {
    return titleCaseToHuman(this.type);
  };

  $5WObjectType.prototype.isNew = function () {
    var p = this.getProto();

    return !p || !p._rev;
  }
    /*[
        </constructor>
      </class>

    <class name="$5WObject">
      <slug>Wrapper for raw Javascript Object to provide 5w metadata.</slug>
      <constructor>
        <param name="data" type="Object">Plain Javascript object to wrap.</param>
  ]*/
  $5WObject = function (data) {
    this.data = data;
    this.busy = false;
  };
  /*[
      </constructor>

      <method name="id">
  ]*/
  $5WObject.prototype.id = function () {
    return this.data._id;
  };
  /*[
      </method>

      <method name="type">
  ]*/
  $5WObject.prototype.type = function () {
    var o = this.data;

    return o.hasOwnProperty('ObjectType') ? o.ObjectType : $5w.typeFromId(this.id());
  };
  /*[
      </method>

      <method name="url">
  ]*/
  $5WObject.prototype.url = function () {
    return $5w.dburl + '/' + this.data._id;
  };
  /*[
      </method>

      <method name="isReadOnly">
  ]*/
  $5WObject.prototype.isReadOnly = function () {
    var ot = $5WObjectType.getType(this.type());
    var proto = ot && ot.getProto();

    return proto && proto.readOnly;
  };
  /*[
      </method>

      <method name="isNew">
  ]*/
  $5WObject.prototype.isNew = function () {
    return !this.data._rev;
  };
  /*[
      </method>

      <method name="displayName">
  ]*/
  $5WObject.prototype.displayName = function () {
    var o = this.data;
    var t = callReturnFirst($5w.extensions, 'displayName', [this]);

    if (t) {
      return t;
    }

    t = o._id;

    var ot = $5WObjectType.getType(this.type());

    if (this.isNew()) {
      return '(new ' + ot.displayName().toLowerCase() + ')';
    }

    var de = ot.proto.display_expression;
    if (de) {
      t = evalJsonTemplate(de, o);
    }

    if (!t) {
      console.log('no display name for object ' + o._id);
    }

    return t ? t : 'missing display expression (' + o._id + ')';
  };
  /*[
      </method>

      <method name="summary">
  ]*/
  $5WObject.prototype.summary = function () {
    var _this = this;
    var o = this.data;

    if (o.hasOwnProperty('Note')) {
      return o.Note;
    }

    switch (this.type()) {
      case 'UpdateActivity': {
        var fl = Object.keys(o.Delta);
        var la = [];

        $.each(fl, function () {
          var mdo = $5w._sms.getMetadata(_this.type(), this);
          la.push(mdo.Label ? mdo.Label.toLowerCase() : this);
        });

        switch (la.length) {
          case 0: {
            return 'Generic update, no fields changed.';
          }

          case 1: {
            return 'Updated ' + la[0] + '.';
          }

          case 2: {
            return 'Updated ' + la[0] + ' and ' + la[1];
          }

          default: {
            var last = la.pop();

            return 'Updated ' + la.join(', ') + ', and ' + last + '.';
          }
        }
      } break;

      case 'VisitActivity': {
        return o.Name;
      } break;

      case 'DeleteActivity': {
        return 'Object was deleted.';
      }
    }

    return '[summary for ' + this.type() + ' needed.]';
  };
  /*[
      </method>

      <method name="update">
  ]*/
  $5WObject.prototype.update = function (delta) {
    var _this = this;

    if (_this.request) {
      var err = new $.Deferred();
      err.reject('Object is busy.');
      return err;
    }
    _this.request = new $.Deferred();

    if (_this.isNew()) {
      $.extend(_this.data, delta);

      _this.data.LastModifiedDate = (new Date()).toCouchString();
      _this.data.LastModifiedById = $5w.user_info.doc_id;

      $5w.saveObject(_this.data)
        .done(function (data) {
          _this.data._rev = data.rev;

          if (!_this.data.IsActivity) {
            var ca = $5WObjectType.makeNew('CreateActivity');
            ca.TargetId = _this.data._id;
            ca.IsActivity = true;
            ca.Note = 'Created new ' + _this.type().toLowerCase()
                + ' (' + _this.displayName() + ').';
            $5w.saveObject(ca)
              .then(function () { _this.request.resolve(); });
          } else {
            _this.request.resolve();
          }
        });
    } else {
      $5w.fetchObject(_this.data._id)
        .done(function (data) {
            _this.data = data;
            for (var key in delta) {
              if (delta.hasOwnProperty(key)) {
                _this.data[key] = delta[key];
              }
            }

            $5w.saveObject(data)
              .done(function (data) {
                  _this.data._rev = data.rev;
                  var ao = $5WObjectType.makeNew('UpdateActivity');
                  ao.TargetId = _this.data._id;
                  ao.IsActivity = true;
                  ao.Delta = delta;
                  $5w.saveObject(ao)
                    .then(function () { _this.request.resolve(); });
                })
              .fail(function () {
                _this.request.reject();
              });
          });
    }
    this.request.then(function () {
        delete _this.request;
      });

    return this.request.promise();
  };
  /*[
      </method>

      <method name="addRelated">
  ]*/
  $5WObject.prototype.addRelated = function (id) {
    var delta = {'$5w_related':(Array.isArray(this.data.$5w_related) ? this.data.$5w_related : [])};
    if (findString(id, delta.$5w_related) >= 0) {
      return (new $.Deferred()).resolve();
    }

    delta.$5w_related.push(id);

    return this.update(delta);
  };
  /*[
      </method>

      <method name="removeRelated">
  ]*/
  $5WObject.prototype.removeRelated = function (id) {
    var i = findString(id, this.data.$5w_related);

    if (i < 0) {
      return (new $.Deferred()).resolve();
    }

    var delta = {'$5w_related':this.data.$5w_related.slice()};
    delta.$5w_related.splice(i, 1);

    return this.update(delta);
  };
  /*[
      </method>

      <method name="inRelated">
  ]*/
  $5WObject.prototype.inRelated = function (id) {
    return this.data.$5w_related && findString(id, this.data.$5w_related) >= 0;
  };
  /*[
      </method>

      <method name="addURLAttachment">
  ]*/
  $5WObject.prototype.addURLAttachment = function (fileURL) {
    var _this = this;

    if (_this.request) {
      var err = new $.Deferred();
      err.reject('Object is busy.');
      return err;
    }
    _this.request = new $.Deferred();

    var fo = new FileUploadOptions();
    fo.fileName = fileURL.substr(fileURL.lastIndexOf('/')+1);
    fo.mimeType =  getMimeType(fileURL);
    fo.headers = {'Content-Type':fo.mimeType};
    fo.httpMethod = 'PUT';

    var aurl = this.url() + '/' + fo.fileName + '?rev=' + _this.data._rev;

    var ft = new FileTransfer();

    ft.upload(fileURL, encodeURI(aurl), function (r) {
        console.log(r);
        _this.request.resolve();
        delete _this.request;
        _this.data.rev = r.response.rev;
      }, function (error) {
        console.log(error);
        alert(error);
        _this.request.reject(error);
        delete _this.request;
      }, fo);

    var po = _this.request.promise();
    po.fileTransfer = ft;

    return po;
  };
  /*[
      </method>

      <method name="addFileAttachment">
  ]*/
  $5WObject.prototype.addFileAttachment = function (file) {
    var _this = this;

    if (_this.request) {
      var err = new $.Deferred();
      err.reject('Object is busy.');
      return err;
    }
    _this.request = new $.Deferred();

    var mimeType = getMimeType(file.name);

    var url = _this.url() + '/' + file.name + '?rev=' + _this.data._rev;
    $.ajax({
      type: 'PUT',
      url,
      data: file,
      processData: false,
      contentType: false,
      headers: {
        'Content-Type': mimeType
      }
    })
      .done(function(data) {
        console.log(data);

        _this.request.resolve();
        delete _this.request;
        _this.data.rev = data.rev;
      })
      .fail(function () {
        alert(error);
        _this.request.reject(error);
        delete _this.request;
      });

    return _this.request.promise();
  };
  /*[
      </method>
    </class>

    <class name="$5WView" abstract="yes">
      <slug>The abstract base class for all $5W*View classes.</slug>
      <constructor>
        <param name="$5w" type="$5W">The singleton instance of the $5W class.</param>
        <param name="el" type="DOMElement">The container &lt;div&gt; to be
            converted into a $5WView.</param>
        <param name="type" type="String">Type of $5W view to create.</param>
  ]*/
  $5WView = function ($5w, el, type) {
    this.$5w = $5w;
    this.el = el;
    $(el).data('$5wview', this);
    $(el).addClass('_5w_view_' + type);
    var template = $('.' + type, $5w.html)[0];
    if (!template) {
      return;
    }
    $(el).each(function () {
      this.classList.add(...template.classList);
    });
    $(el).append(template.innerHTML);
  };
  /*[
    </class>

    <class name="$5WLoginView" superclass="$5WView">
  ]*/
  $5WLoginView = function ($5w, el, type) {
    var _this = this;

    $5WView.call(this, $5w, el, type);

    $('form', el).submit(function () {
      _this.$5w.login(this.user.value, this.pass.value);

      return false;
    });
  };
  /*[
    </class>

    <class name="$5WBrowserView" superclass="$5WView">
  ]*/
  $5WBrowserView = function ($5w, el, type) {
    var _this = this;

    $5WView.call(this, $5w, el, type);

    $(el).on('5w_pane_visible', function () {
      $('._5w_search_box input', this).focus();
    });

    _this.search_list = _this.$5w.makeView($('.search', _this.el), 'search_list');
    _this.activity_list = _this.$5w.makeView($('.feed', _this.el), 'activity_list');
    _this.related = _this.$5w.makeView($('.my_items', _this.el), 'related');

    _this.syncRelated();

    $('._5w_search_box input', el).on('input', function () {
      _this.search_list.search($(this).val());
      _this.activity_list.filter($(this).val());
    });

    var mh = new Hammer($('._5w_menu', el)[0]);
    mh.on('tap', function (e) { $(e.target).trigger('5w_open_menu', [_this]); });

    var th = new Hammer($('.tabbar', el)[0]);
    th.on('tap', function (e) { _this.tabTap(e); });

    var lh = new Hammer($('._5w_search_list', el)[0]);
    lh.on('tap', function (e) { _this.listTap(e); });
  };

  $5WBrowserView.prototype.refresh = function () {
    var ss = $('._5w_search_box input', this.el).val();
    this.search_list.search(ss);
    this.activity_list.filter(ss);
    this.syncRelated();

    var afo = $('._5w_view_activity_list', this.el).data('$5wview');
    afo.fetchActivities();
  };

  $5WBrowserView.prototype.syncRelated = function () {
    var _this = this;

    if (_this.rop && _this.rop.state() == 'pending') {
      return;
    }

    _this.rop = this.$5w.getRelatedObjects(_this.$5w.user_info.doc_id);

    _this.rop.done(function (data, textStatus, jqXHR) {
          _this.related.render(data);
          delete _this.rop;
        })
      .fail(function () {
          console.log('syncRelated failed');
          delete _this.rop;
        });
  };

  $5WBrowserView.prototype.tabTap = function (e) {
    if (e.target.tagName != 'LI') {
      return;
    }

    var tl = $(e.target).closest('ul.tabbar');
    if (tl.length) {
      var st = $(e.target).text().replace(' ', '_');

      $('li', tl).removeClass('selected');
      $(e.target).addClass('selected');

      $('._5w_container', this.el).addClass('hidden');
      $('._5w_container.' + st, this.el).removeClass('hidden');
      this.$5w.fixup();
    }
  };

  $5WBrowserView.prototype.listTap = function (e) {
    var li = $(e.target).closest('*[data-id]');
    if (li.length) {
      $(li).trigger('5w_open_object', [$(li).attr('data-id'), 'push']);
    }
  };

  $5WBrowserView.prototype.willShow = function () {
    this.refresh();
  };
  /*[
    </class>

    <class name="$5WBrowserView" superclass="$5WView">
  ]*/
  $5WPageView = function ($5w, el, type) {
    var _this = this;

    $5WView.call(this, $5w, el, type);

    var ch = new Hammer($('.fa-arrow-up', el)[0]);
    ch.on('tap', function () {
      _this.$5w.popPane();
    });
  };

  $5WPageView.prototype.setContent = function (title, content) {
    $('._5w_header span', this.el).html(title);
    $('._5w_container', this.el).html(content);
  };
  /*[
    </class>

    <class name="$5WViewerView" superclass="$5WView">
  ]*/
  $5WViewerView = function ($5w, el, type) {
    var _this = this;

    _this.isEditing = false;

    $5WView.call(this, $5w, el, type);

    var fh = new Hammer($(el)[0], {preventDefault: true});
    fh.on('press', function (e) { _this.handlePress(e); });
    fh.on('tap', function (e) { _this.handleTap(e); });
  };

  $5WViewerView.prototype.loadObject = function (id) {
    var _this = this;

    if (typeof id === 'object') {
      _this._syncInfo(id);

      return (new $.Deferred()).resolve();
    }

    var fop = this.$5w.fetchObject(id)
      .done(function (data) {
        _this._raw_5wo_data = data;
      });

    var ap = this.$5w.getActivities(id);
    ap.done(function (data, textStatus, jqXHR) {
        _this._raw_activities_data = data;
      });

    var rop = this.$5w.getRelatedObjects(id);
    rop.done(function (data, textStatus, jqXHR) {
        _this._raw_related_objects_data = data;
      });

    var lcp = new $.Deferred();

    var wp = $.when(fop, ap, rop)
      .done(function () {
          _this._syncInfo(_this._raw_5wo_data);
          _this._syncActivities(_this._raw_activities_data);
          _this._syncRelatedObjects(_this._raw_related_objects_data);
          lcp.resolve();
        })
      .fail(function () {
          lcp.reject();
        });

    return lcp.promise();
  };

  $5WViewerView.prototype.refresh = function () {
    var _this = this;

    _this.$5w.showBusy();
    _this.loadObject(_this.$5wo.id())
      .then(function () {
        _this.$5w.hideBusy();
      });
  };

  $5WViewerView.prototype._syncInfo = function (data) {
    var _this = this;

    var id = data._id;
    var $5wo = new $5WObject(data);
    _this.$5wo = $5wo;

    $(_this.el).addClass('_5w_type_' + $5w.typeFromId(id));

    $('._5w_obj_title div', _this.el).text($5wo.displayName());

    var ot = $5WObjectType.getType(_this.$5w.typeFromId(id));
    var kl = ot && ot.fields;
    var vl = Object.keys($5wo.data);

    if (!kl) {
      kl = vl;
    } else {
      $.each(vl, function (i, key) {
        if (kl.indexOf(key) < 0) {
          kl.push(key);
        }
      });
    }

    $('._5w_container.info form', _this.el).empty();
    $.each(kl, function (i, key) {
      if (isString(key)) {
        var fv = _this.$5w.makeView($('<div/>'), 'field');
        fv._init(_this, key);
        $('._5w_container.info form', _this.el).append(fv.el);
      } else {
        switch (key.type) {
          case 'header': {
            $('._5w_container.info form', _this.el).append('<h4>' + key.label + '</h4>');
          } break;
        }
      }
    });

    _this._syncActionBar();
  };

  $5WViewerView.prototype._syncActionBar = function () {
    var _this = this;

    if (this.$5wo.isReadOnly()) {
      $('._5w_header .fa-edit, .related .fa-plus', this.el).addClass('hidden');
    } else {
      $('._5w_header .fa-edit, .related .fa-plus', this.el).removeClass('hidden');
    }

    var ab = $('._5w_header ._5w_bicon_bar.action', this.el);
    var sd = [['_5w_field_type_phone','fa-phone']
        , ['_5w_field_type_mobile', 'fa-mobile']
        , ['_5w_field_type_mobile', 'fa-comment-alt']
        , ['_5w_field_type_email', 'fa-envelope']
        , ['_5w_field_type_physical_address', 'fa-map-o']
      ];

    $(ab).empty();
    $.each(sd, function (i, v) {
      if ($('.' + v[0], _this.el).not('._5w_empty').length > 0) {
        $(ab).append('<i class="_5w_bicon fa ' + v[1] + '" ' +
            'data-proxy-for="' + v[0] + '">&nbsp;</i>');
      }
    });

    var tp = $5WObjectType.getType(_this.$5wo.type());

    if (tp.getProto() && tp.getProto().allow_create.length) {
      $(ab).append('<div class="_5w_bicon fa fa-plus flyout_parent">&nbsp;</div>');
    }
  };

  $5WViewerView.prototype._syncActivities = function (data) {
    var _this = this;

    $('._5w_container.feed', _this.el).empty();
    $.each(data.rows, function () {
      var doc = this.doc;
      var av = _this.$5w.makeView($('<div/>'), 'activity');
      av.setActivity(doc);

      $('._5w_container.feed', _this.el).append(av.el);
    });
  };

  $5WViewerView.prototype._syncRelatedObjects = function (rows) {
    // !!!TODO!!! refactor this to use the $5WRelatedView class
    var _this = this;

    var ul;
    var ulUnk;
    var lastType;
    var idd = {};

    $('._5w_container.related', _this.el).empty();
    $.each(rows, function () {
      var id = this.value;

      if (id in idd) {
        return;
      }

      idd[id] = true;

      var type = _this.$5w.typeFromId(id);
      if (type) {
        if (type != lastType) {
          if (ul) {
            $('._5w_container.related', _this.el).append(ul);
          }

          $('._5w_container.related', _this.el).append('<h4 class="_5w_accordion"><i class="fa fa-plus _5w_bicon">&nbsp;</i>' + type + '</h4>');
          ul = $('<ul class="hidden"/>');

          lastType = type;
        }
        var sv = _this.$5w.makeView($('<li/>'), 'doc_slug');
        sv.setDocumentId(id);
        $('img', sv.el).remove();

        if (_this.$5wo.inRelated(id)) {
          $(sv.el).prepend('<i class="fa fa-times _5w_delete" data-id="' + id + '">&nbsp;</i>');
        }

        $(ul).append(sv.el);
      } else {
        if (!ulUnk) {
          ulUnk = $('<ul/>');
        }
        $(ulUnk).append('<li>' + id + '</li>');
      }
    });

    if (ul) {
      $('._5w_container.related', _this.el).append(ul);
    }

    if (ulUnk) {
      $('._5w_container.related', _this.el).append('<h4>other</h4>').append(ulUnk);
    }
  };

  $5WViewerView.prototype.formEditing = function () {
    return $('._5w_editing', this.el).length > 0;
  };

  $5WViewerView.prototype.handlePress = function (e) {
    if (this.formEditing() || !this.$5w.isAdmin()) {
      return;
    }

    switch (e.target.tagName) {
      case 'LABEL': {
        var fc = $(e.target).closest('*[data-fieldname]');
        if (fc.length) {
          this.editField($(fc).attr('data-fieldname'));
        }
      } break;

      case 'I': {
        if ($(e.target).hasClass('fa-edit')) {
          $(e.target).closest('._5w_view_viewer').addClass('_5w_field_editing');
        }
      } break;
    }
  };

  $5WViewerView.prototype.handleTap = function (e) {
    var _this = this;

    var vv = $(e.target).closest('._5w_view_viewer');

    if ($(e.target).closest('._5w_header').length > 0) {
      if ($(e.target).hasClass('fa-arrow-up')) {
        if (!this.formEditing() || confirm('Discard your changes?')) {
          $5w.popPane();
        }

        return;
      } else if ($(e.target).hasClass('fa-check-circle')) {
        $5WObjectType.rebuildSearchIndexView();

        $(e.target).closest('._5w_field_editing').removeClass('_5w_field_editing');
      } else if ($(e.target).hasClass('fa-edit')) {
        this.startEditing();
      } else if ($(e.target).hasClass('fa-check') || $(e.target).hasClass('fa-times')) {
        if ($(e.target).hasClass('fa-check')) {
          this.saveAndEndEditing();
        } else {
          this.endEditing(true);
        }
      } else if ($(e.target).hasClass('fa-plus')) {
        if ($(e.target).closest('.r_action').length) {
          this.addRelated();
        } else if ($(e.target).closest('.info').length) {
          this.showAddMenu(e);
        }
      }
    }

    if ($(e.target).hasClass('_5w_delete')) {
      if ($(e.target).closest('.related').length) {
        var id = $(e.target).attr('data-id');

        _this.$5w.showBusy();
        _this.$5wo.removeRelated(id)
          .then(function () {
              _this.$5w.getRelatedObjects(_this.$5wo.data._id)
                .done(function (data, textStatus, jqXHR) {
                    _this._syncRelatedObjects(data);
                    _this.$5w.fixup();
                  })
                .then(function () {
                    _this.$5w.hideBusy();
                  });
            });
      }
    }

    var vf = $(e.target).closest('._5w_view_field');
    if (vf.length) {
      var vo = $(vf).data('$5wview');

      vo.handleTap(e);
    }

    var pf = $(e.target).attr('data-proxy-for');
    if (pf) {
      var vo = $(vv).find('.' + pf).data('$5wview');

      vo.handleTap(e);
    }

    if (e.target.tagName == 'LI') {
      var tl = $(e.target).closest('ul.tabbar');
      if (tl.length && !$(e.target).hasClass('selected')) {
        if (this.formEditing()) {
          if (confirm('Discard your changes?')) {
            this.endEditing(true);
          } else {
            return;
          }
        }
        var st = $(e.target).text();

        $('li', tl).removeClass('selected');
        $(e.target).addClass('selected');

        $('._5w_header>div', vv).addClass('hidden');
        $('._5w_header div.' + st, vv).removeClass('hidden');

        $('._5w_container', vv).addClass('hidden');
        $('._5w_container.' + st, vv).removeClass('hidden');
      }
    }

    var ah = $(e.target).closest('._5w_accordion');
    if (ah.length) {
      var collapse = $('i', ah).hasClass('fa-minus');
      if (collapse) {
        $('i', ah).removeClass('fa-minus').addClass('fa-plus');
      } else {
        $('i', ah).removeClass('fa-plus').addClass('fa-minus');
      }
      $(ah).next().slideToggle(150);
    }
  };

  $5WViewerView.prototype.startEditing = function () {
    this.isEditing = true;

    $('._5w_header .fa-edit', this.el).addClass('hidden');

    $('._5w_header ._5w_bicon_bar.action', this.el).addClass('hidden');
    $('._5w_header ._5w_bicon_bar.editing', this.el).removeClass('hidden');

    $('.info form', this.el).addClass('_5w_editing');

    $('.info form ._5w_view_field', this.el).each(function () {
      var vo = $(this).data('$5wview');

      vo.refresh();
    });
  };

  $5WViewerView.prototype.saveAndEndEditing = function () {
    var _this = this;

    var delta = this.getDelta();
    $5w.showBusy();

    this.$5wo.update(delta)
      .then(function () {
        _this.endEditing(true);
        $5w.hideBusy();
      });
  };

  $5WViewerView.prototype.endEditing = function (refresh) {
    $('._5w_header .fa-edit', this.el).removeClass('hidden');

    $('._5w_header ._5w_bicon_bar.editing', this.el).addClass('hidden');
    $('._5w_header ._5w_bicon_bar.action', this.el).removeClass('hidden');

    $('.info form', this.el).removeClass('_5w_editing');

    this.isEditing = false;

    if (this.$5wo.isNew()) {
      $5w.popPane();
    } else if (refresh) {
      this.refresh();
    }
  };

  $5WViewerView.prototype.showAddMenu = function (e) {
    var _this = this;

    var tp = $5WObjectType.getType(_this.$5wo.type());
    var proto = tp.getProto();

    var cm = $($('.viewer_menu', _this.$5w.html).html());

    $('ul', cm).append('<li>attach image</li>');
    $('ul', cm).append('<li>attach document</li>');

    $.each(proto.allow_create, function () {
      var type = this;
      var op = $5WObjectType.getType(this);
      var opp = op && op.getProto();
      var mc = op.create_fa_class;

      var li = $('<li data-type="' + type + '">new ' + op.displayName().toLowerCase() + '</li>');
      $('ul', cm).append(li);
    });

    $(e.target).append(cm);

    var mt = new Hammer($('.flyout_menu', e.target)[0]);
    mt.on('tap', function (e) { _this.handleAddMenuTap(e); });
  };

  $5WViewerView.prototype.handleAddMenuTap = function (e) {
    var _this = this;
    var parentType = _this.$5wo.type();

    var fm = $(e.target).closest('.flyout_menu');
    $(fm).remove();

    var type = $(e.target).attr('data-type');
    if (type) {
      var ot = $5WObjectType.getType(type);
      var ov = $('<div/>');
      var v = $5w.makeView(ov, 'viewer');
      var nd = $5WObjectType.makeNew(type);
      if (ot.isActivity()) {
        nd.IsActivity = true;
        nd.TargetId = _this.$5wo.id();
      } else {
        nd[parentType + 'Id'] = _this.$5wo.id();
      }

      v.loadObject(nd)
        .done(function () {
          $5w.pushPane(v.el);
          v.startEditing();
          _this.needsRefresh = true;
        });
    } else if ($(e.target).text() == 'attach image') {
      e.preventDefault();

      var av = $5w.makeView($('<div/>'), 'attach_image');
      av.setObject(_this.$5wo);
      $5w.overlayPane(av.el);
    } else if ($(e.target).text() == 'attach document') {
      e.preventDefault();

      var av = $5w.makeView($('<div/>'), 'attach_document');
      av.setObject(_this.$5wo);
      $5w.overlayPane(av.el);
    }

  };

  $5WViewerView.prototype.addRelated = function () {
    var _this = this;

    this.doc_lookup = $5w.makeView($('<div/>'), 'doc_lookup');
    $5w.pushPane(this.doc_lookup.el);
    $(this.doc_lookup.el).on('5w_doc_tap', function (e, id) {
      _this.$5w.showBusy();
      _this.$5wo.addRelated(id)
        .then(function () {
          _this.$5w.getRelatedObjects(_this.$5wo.data._id)
            .done(function (data, textStatus, jqXHR) {
                _this._syncRelatedObjects(data);
                _this.$5w.fixup();
              })
            .then(function () {
              _this.$5w.popPane();
              _this.$5w.hideBusy();
            });
        });
    });
  };

  $5WViewerView.prototype.getDelta = function () {
    var _this = this;
    var $5wo = _this.$5wo;
    var delta = {};

    $('.info form ._5w_view_field', _this.el).each(function () {
      var vo = $(this).data('$5wview');
      var ov = $5wo.data[vo.fieldName];
      var nv = vo.value();
      if (ov != nv) {
        delta[vo.fieldName] = nv;
      }
    });

    return delta;
  };

  $5WViewerView.prototype.editField = function (fieldName) {
    var _this = this;

    var fev = this.$5w.makeView($('<div class="_5w_popup_form"/>'), 'field_edit');

    fev.edit(this.$5wo.type(), fieldName);

    this.$5w.overlayPane(fev.el);
  };

  $5WViewerView.prototype.willShow = function () {
    if (this.needsRefresh) {
      this.refresh();
      delete this.needsRefresh;
    }
  };
  /*[
    </class>

    <class name="$5WFieldView">
  ]*/
  $5WFieldView = function ($5w, el, type) {
    var _this = this;

    $5WView.call(this, $5w, el, type);
  };

  $5WFieldView.prototype._init = function (viewer, fieldName) {
    var _this = this;
    this.viewer = viewer;
    this.fieldName = fieldName;

    this.mdo = this.$5w._sms.getMetadata(this.viewer.$5wo.type(), fieldName);

    if (this.mdo.hidden) {
      $(this.el).addClass('_5w_field_hidden');
    }

    if (this.mdo.readonly) {
      $(this.el).addClass('_5w_field_readonly');
    }

    $(this.el).addClass('_5w_field_type_' + this.mdo.type);

    $(this.el).attr('data-fieldname', fieldName);
    $('label', this.el).text(this.mdo.label ? this.mdo.label : fieldName.replace(/([A-Z])/g, " $1"));

    var o = this.viewer.$5wo.data;
    if (!o[fieldName]) {
      $(this.el).addClass('_5w_empty');
    }

    switch (this.mdo.type) {
      case 'boolean': {
        var v = docToBool(o[fieldName]);
        $('div', this.el).append('<i class="fa fa-'
            + (v ? 'check _5w_true' : 'times _5w_false')
            + '">&nbsp;</i>')
      } break;

      case 'currency': {
        $('div', this.el).text(Number.parseFloat(o[fieldName]).toFixed(2));
      } break;

      case 'datetime': {
        this.date = o[fieldName];
        if (this.date) {
          $('div', this.el).text(moment(this.date).format('hh:mm A MM/DD/YYYY'));
        }
      } break;

      case 'date': {
        this.date = o[fieldName];
        if (this.date) {
          $('div', this.el).text(moment(this.date).format('MM/DD/YYYY'));
        }
      } break;

      case 'email':
      case 'url':
      case 'phone':
      case 'mobile':
      case 'physical_address': {
        $('div', this.el).append('<a>' + o[fieldName] + '</a>');
      } break;

      case 'mailing_address':
      case 'physical_address': {
        $('div', this.el).text(docToString(o[fieldName]));
      } break;

      case 'document_link': {
        var dls = this.$5w.makeView($('<span/>'), 'doc_slug');
        dls.setDocumentId(o[fieldName]);
        $('div', this.el).append(dls.el);
      } break;

      case 'attachments': {
        if (o[fieldName]) {
          var ul = $('<ul/>');
          $.each(o[fieldName], function (k, v) {
            $(ul).append('<li><a data-href="'+ _this.$5w.getObjectUrl(o._id) + '/' + k + '">'
                + '<img src="https://mimecons.com/24/' + v.content_type + '"/>'
                + k + '</a></li>'
            );
          });
          $('div', this.el).append(ul);
        }
      } break;

      case 'markdown': {
        if (o[fieldName]) {
          $('div', this.el).html(snarkdown(o[fieldName]));
        }
      } break;

      default: {
        $('div', this.el).text(docToString(o[fieldName]));
      } break;
    }
  };

  $5WFieldView.prototype.refresh = function () {
    var editing = !this.mdo.readonly && $(this.el).closest('._5w_editing').length > 0;

    var o = this.viewer.$5wo.data;

    if (!editing && !this.value()) {
      $(this.el).addClass('_5w_empty');
    } else {
      $(this.el).removeClass('_5w_empty');
    }

    switch (this.mdo.type) {
      case 'choice': {
        if (editing) {
          var v = docToString(o[this.fieldName]);
          var cl = $.map(this.mdo.choices.split(','), $.trim);
          var sel = $('<select name="' + this.fieldName + '"/>');
          if (cl.indexOf(v) < 0) {
            $(sel).append('<option>' + v + '</option>');
          }
          $.each(cl, function () {
            var o = $('<option>' + this + '</option>');
            if (v == this) {
              $(o).attr('selected', 'selected');
            }
            $(sel).append(o);
          });
          $('div', this.el).empty().append(sel);
        } else {
          $('div', this.el).text(docToString(o[this.fieldName]));
        }

      } break;

      case 'boolean': {
      } break;

      case 'currency': {
        if (editing) {
          $('div', this.el).attr('contenteditable', true);
          $('div', this.el).text(docToNum(o[this.fieldName]));
        } else {
          $('div', this.el).attr('contenteditable', false);
          $('div', this.el).text(Number.parseFloat(o[this.fieldName]).toFixed(2));
        }
      } break;

      case 'datetime':
      case 'date': {
        var ds = this.date ? moment(this.date).format(this.mdo.type == 'datetime' ? 'hh:mm A MM/DD/YYYY' : 'MM/DD/YYYY')
          : '(no date)';
        if (editing) {
          $('div', this.el).html(ds + '<i class="fa fa-calendar _5w_bicon">&nbsp;</i>');
        } else {
          $('div', this.el).text(ds);
        }
      } break;

      case 'email':
      case 'url':
      case 'phone':
      case 'mobile':
      case 'physical_address': {
        if (editing) {
          $('div', this.el).attr('contenteditable', true).text(docToString(o[this.fieldName]));
        } else {
          $('div', this.el).attr('contenteditable', false).html('<a>' + docToString(o[this.fieldName]) + '</a>');
        }
      } break;

      case 'document_link': {
        var dls = $('span', this.el).data('$5wview');
        dls.setDocumentId(o[this.fieldName], editing ? ['lookup'] : ['over', 'down']);
      } break;

      case 'attachments': {
      } break;

      default: {
        $('div', this.el).attr('contenteditable', editing).text(docToString(o[this.fieldName]));
      } break;
    }
  };

  $5WFieldView.prototype.value = function () {
    var editing = !this.mdo.readonly && $(this.el).closest('._5w_editing').length > 0;
    var val = this.viewer.$5wo.data[this.fieldName];

    if (editing) {
      switch (this.mdo.type) {
        case 'choice': {
          if (editing) {
            val = $('select', this.el).val();
          }
        } break;

        case 'boolean': {
          if (editing) {
            val = $('i', this.el).hasClass('_5w_true');
          }
        } break;

        case 'datetime':
        case 'date': {
          return this.date;
        } break;

        case 'document_link': {
          if (editing) {
            var dls = $('span', this.el).data('$5wview');
            val = dls.getDocumentId();
          }
        } break;

        case 'attachments': {
        } break;

        default: {
          val = nullForEmpty(contentToString($('>div', this.el)[0]));
        } break;
      }
    }

    return val;
  };

  $5WFieldView.prototype.handleTap = function (e) {
    var _this = this;

    if (this.viewer.formEditing()) {
      switch (this.mdo.type) {
        case 'boolean': {
          var i = $('i', this.el);
          var f = $(i).hasClass('_5w_true');
          $(i).removeClass();
          $(i).addClass(f ? 'fa fa-times _5w_false' : 'fa fa-check _5w_true');
        } break;

        case 'datetime':
        case 'date': {
          if ($(e.target).hasClass('fa-calendar')) {
            var st = this.mdo.type == 'datetime';

            e.preventDefault();

            this.date_picker = $5w.makeView($('<div/>'), 'date_picker');
            $(this.date_picker.el).on('5w_date_changed', function (e, date) {
              _this.date = date;
              var ds = moment(date).format(st ? 'hh:mm A MM/DD/YYYY' : 'MM/DD/YYYY');
              $('div', _this.el).html(ds + '<i class="fa fa-calendar _5w_bicon">&nbsp;</i>');
            });
            this.date_picker.setType(this.mdo.type);
            this.date_picker.setLabel(this.mdo.label);
            this.date_picker.setDate(this.value());

            $5w.pushPane(this.date_picker.el);
          }
        } break;

        case 'document_link': {
          if ($(e.target).hasClass('fa-search')) {
            this.doc_lookup = $5w.makeView($('<div/>'), 'doc_lookup');
            $5w.pushPane(this.doc_lookup.el);
            $(this.doc_lookup.el).on('5w_doc_tap', function (e, id) {
              var dls = $('span', _this.el).data('$5wview');
              dls.setDocumentId(id, _this.viewer.isEditing ? ['lookup'] : ['over', 'down']);
              _this.$5w.fixup();
              _this.$5w.popPane();
            });
          }
        } break;
      }

      return;
    }

    var o = this.viewer.$5wo.data;

    var href = $(e.target).attr('data-href');
    if (href) {
      window.open(href, '5w_attachments');
    }

    if (!o[this.fieldName]) {
      return;
    }

    var en = '5w_tap_' + this.mdo.type, ea = {"$5wo":this.viewer.$5wo};
    switch (this.mdo.type) {
      case 'url': {
        var url = qualifyURL(o[this.fieldName]);

        en = '5w_launch_url';
        ea.url = url;
        window.open(url, '_system');
      } break;

      case 'physical_address': {
        en = '5w_launch_address';
        ea.address = o[this.fieldName];

        if (e.target.tagName != 'I') {
          var url = 'http://maps.apple.com/?q=' + encodeURIComponent(ea.address);
          window.open(url, '_system');
        }
      } break;

      case 'email': {
        en = '5w_launch_email';
        ea.email = o[this.fieldName];
        window.open('mailto:' + encodeURI(o[this.fieldName]), '_system');
      } break;

      case 'phone': {
        en = '5w_launch_phone';
        ea.phone = o[this.fieldName];
        window.open('tel:' + encodeURI(o[this.fieldName]), '_system');
      } break;

      case 'mobile': {
        ea.phone = o[this.fieldName];

        if ($(e.target).hasClass('fa-comment-alt')) {
          en = '5w_launch_sms';
          window.open('sms:' + encodeURI(o[this.fieldName]), '_system');
        } else {
          en = '5w_launch_mobile';
          window.open('tel:' + encodeURI(o[this.fieldName]), '_system');
        }
      } break;
    }

    $(e.target).trigger(en, [ea]);
  };
  /*[
    </class>

    <class name="$5WFieldEditView">
  ]*/
  $5WFieldEditView = function ($5w, el, type) {
    var _this = this;

    $5WView.call(this, $5w, el, type);

    var closeEdit = function (e) {
      _this.$5w.popPane();

      return false;
    };

    var saveEdit = function (e) {
      _this.save();
      _this.$5w.popPane();

      return false;
    };

    var syncUI = function (e) {
      if ($('select[name=type]', _this.el).val() == 'choice') {
        $('.choices_field', _this.el).removeClass('hidden');
      } else {
        $('.choices_field', _this.el).addClass('hidden');
      }
    };

    $('form', this.el).submit(saveEdit);

    var ch = new Hammer($('._5w_close', this.el)[0]);
    ch.on('tap', closeEdit);

    $('select[name=type]', this.el).on('change', syncUI);

    $('button[name=cancel]', this.el).click(closeEdit);

    this.$5w.makeView($('._5w_scope', this.el), 'scope');
  };

  $5WFieldEditView.prototype.edit = function (objectType, fieldName) {
    var _this = this;

    this.objectType = objectType;
    this.fieldName = fieldName;

    var md = this.$5w._sms.getMetadata(objectType, fieldName);
    var mds = this.$5w._sms.getMetadataScope(objectType, fieldName);

    $('h1 span', this.el).text(fieldName);

    $.each(md, function (key, value) {
      var ie = $('*[name=' + key + ']', _this.el);
      if (ie.length) {
        if (typeof value == 'boolean') {
          $(ie).prop('checked', value);
        } else {
          $(ie).val(value);
        }

        var se = $('.scope_' + key, _this.el);
        var svo = $(se).data('$5wview');
        svo.setScopeIndex($5WSMS.scopeIndex(mds[key]));
      }
    });

    $('select[name=type]', this.el).change();
  };

  $5WFieldEditView.prototype.save = function () {
    var _this = this;

    $('.prop', this.el).each(function () {
      var se = $('.scope_' + this.name, _this.el);
      var svo = $(se).data('$5wview');
      var val;

      switch (this.tagName) {
        case 'INPUT': {
          switch (this.type) {
            case 'text': {
              val = $(this).val();
            } break;

            case 'checkbox': {
              val = $(this).is(':checked');
            } break;
          }
        } break;

        case 'SELECT': {
          val = $(this).val();
        } break;
      }
      if (val !== undefined) {
        _this.$5w._sms.setMetadata(svo.getScopeName(), _this.objectType,
            _this.fieldName, this.name, val);
      }
    });

    this.$5w._sms.saveStore();
  };
  /*[
    </class>

    <class name="$5WDocSlugView">
  ]*/
  $5WDocSlugView = function ($5w, el, type) {
    var _this = this;

    $5WView.call(this, $5w, el, type);
  };

  $5WDocSlugView.prototype.setDocumentId = function (id, links) {
    this.id = id;

    if (!links) {
      links = ['over', 'down'];
    }
    $(this.el).empty();
    $(this.el).removeClass();
    if (!id && findString('lookup', links) < 0) {
      return;
    }

    $(this.el).addClass('_5w_type_' + $5w.typeFromId(id));
    var display = $5w.getDisplayName(id) || '';

    var html = '<img src="img/1x1.png"/><span class="_5w_fixup" data-fixup="5w_fixup_docref" data-id="' + id + '">' + (display ? display : id) + '</span>';
    if (findString('over', links) >= 0) {
      html += '<i class="_5w_bicon fa fa-arrow-right fa-4 _5w_doc_link" data-id="'
          + id + '">&nbsp;</i>';
    }
    if (findString('down', links) >= 0) {
      html += '<i class="_5w_bicon fa fa-arrow-down fa-4 _5w_doc_link _5w_push" data-id="'
          + id + '">&nbsp;</i>';
    }
    if (findString('lookup', links) >= 0) {
      html += '<i class="_5w_bicon fa fa-search" data-id="'
          + id + '">&nbsp;</i>';
    }
    $(this.el).append(html);
  };

  $5WDocSlugView.prototype.getDocumentId = function () {
    return this.id;
  };
  /*[
    </class>

    <class name="$5WActivityView">
  ]*/
  $5WActivityView = function ($5w, el, type) {
    $5WView.call(this, $5w, el, type);
  };

  $5WActivityView.prototype.setActivity = function (doc, showTarget) {
    $(this.el).empty();
    $(this.el).removeClass();
    if (!doc) {
      return;
    }
    this.$5wo = new $5WObject(doc);

    var ud = this.el;
    $(ud).addClass('_5w_activity');

    var tb = $('<table/>');

    if (showTarget) {
      var ts = this.$5w.makeView($('<div/>'), 'doc_slug');
      ts.setDocumentId(doc.TargetId);
      var tr = $('<tr/>');
      $(tb).append($(tr).append($('<td class="target" colspan="2"/>').append(ts.el)));
    }

    var uds = this.$5w.makeView($('<div/>'), 'doc_slug');
    uds.setDocumentId(doc.CreatedById);

    var ed = $('<tr/>');
    $(ed).append('<td class="icon"><img src="img/5w_icons/_5w_type_' + doc.ObjectType + '-48.png"/></td>');
    var summary = this.$5wo.summary();

    $(ed).append('<td><p>' + summary + '</p></td>');
    $(tb).append(ed);

    var ts = $('<td class="timestamp" colspan="2"/>');
    $(ts).append(moment(doc.CreatedDate).fromNow());
    $(ts).append(' by ');
    $(ts).append(uds.el);

    $(tb).append($('<tr/>').append(ts));

    $(ud).append(tb);
  };
  /*[
    </class>

    <class name="$5WRelatedView">
  ]*/
  $5WRelatedView = function ($5w, el, type) {
    var _this = this;

    $5WView.call(this, $5w, el, type);

    var th = new Hammer(el);
    th.on('tap', function (e) { _this.handleTap(e); });
  };

  $5WRelatedView.prototype.handleTap = function (e) {
    var ah = $(e.target).closest('._5w_accordion');
    if (ah.length) {
      var collapse = $('i', ah).hasClass('fa-minus');
      if (collapse) {
        $('i', ah).removeClass('fa-minus').addClass('fa-plus');
      } else {
        $('i', ah).removeClass('fa-plus').addClass('fa-minus');
      }
      $(ah).next().slideToggle(150);
    }
  };

  $5WRelatedView.prototype.render = function (rows) {
    var _this = this;

    var ul;
    var ulUnk;
    var lastType;
    var idd = {};

    $(_this.el).empty();
    $.each(rows, function () {
      var id = this.id;

      if (id in idd) {
        return;
      }

      idd[id] = true;

      var type = _this.$5w.typeFromId(id);
      if (type) {
        if (type != lastType) {
          if (ul) {
            $(_this.el).append(ul);
          }

          $(_this.el).append('<h4 class="_5w_accordion"><i class="fa fa-minus _5w_bicon">&nbsp;</i>' + type + '</h4>');
          ul = $('<ul/>');

          lastType = type;
        }
        var sv = _this.$5w.makeView($('<li/>'), 'doc_slug');
        sv.setDocumentId(id);
        $('img', sv.el).remove();

        if (_this.$5wo && _this.$5wo.inRelated(id)) {
          $(sv.el).prepend('<i class="fa fa-times _5w_delete" data-id="' + id + '">&nbsp;</i>');
        }

        $(ul).append(sv.el);
      } else {
        if (!ulUnk) {
          ulUnk = $('<ul/>');
        }
        $(ulUnk).append('<li>' + id + '</li>');
      }
    });

    if (ul) {
      $(_this.el).append(ul);
    }

    if (ulUnk) {
      $(_this.el).append('<h4>other</h4>').append(ulUnk);
    }
  };
  /*[
    </class>

    <class name="$5WActivityListView">
  ]*/
  $5WActivityListView = function ($5w, el, type) {
    var _this = this;

    $5WView.call(this, $5w, el, type);

    $(this.el).on('scroll', function (e) { _this.handleScroll(e); });

    this.fetchActivities();
  };

  $5WActivityListView.prototype.fetchActivities = function (fetchOlder) {
    var _this = this;

    if (_this.request) {
      return;
    }

    var isEmpty = $('._5w_activity', _this.el).length === 0;

    var vp = {'viewName':'activities', 'include_docs':true
        , 'descending':true};

    if (!isEmpty) {
      if (fetchOlder) {
        var lastObj = $('._5w_activity:last', _this.el).data('$5wview').$5wo;
        vp.startkey = lastObj.data.CreatedDate;
      } else {
        var firstObj = $('._5w_activity:first', _this.el).data('$5wview').$5wo;
        vp.endkey = firstObj.data.CreatedDate;
        vp.limit = -1;
      }
    }

    var ld = $('<div class="_5w_loading"><img src = "img/white_spinner.gif" width="40" height="40"/></div>');
    if (fetchOlder) {
      $(this.el).append(ld);
    } else {
      $(this.el).prepend(ld);
    }

    _this.request = this.$5w.fetchView(vp)
      .done(function (data) {
          var firstView = $('._5w_activity:first', _this.el);

          $.each(data.rows, function () {
            var doc = this.doc;
            var av = _this.$5w.makeView($('<div/>'), 'activity');
            av.setActivity(doc, true);

            if (isEmpty || fetchOlder) {
              if (isEmpty || doc.CreatedDate < vp.startkey) {
                $(_this.el).append(av.el);
              }
            } else {
              if (doc.CreatedDate > vp.endkey) {
                $(av.el).insertBefore(firstView);
              }
            }
          });

          _this.$5w.fixup();
          _this.filter(_this._ss);
        })
      .then(function () {
          $('._5w_loading', _this.el).remove();
          delete _this.request;
        });
  };

  $5WActivityListView.prototype.filter = function (ss) {
    var _this = this;

    if (!ss) {
      delete _this._ss;

      $('._5w_activity', _this.el).removeClass('hidden');

      return;
    }

    _this._ss = ss.toUpperCase();

    $('._5w_activity', _this.el).each(function () {
      if ($(this).text().toUpperCase().indexOf(_this._ss) >= 0) {
        $(this).removeClass('hidden');
      } else {
        $(this).addClass('hidden');
      }
    });
  };

  $5WActivityListView.prototype.handleScroll = function (e) {
    var t = e.target;

    if ($(t).scrollTop() <= 0) {
      this.fetchActivities();
    } else if ($(t).scrollTop() + $(t).innerHeight() >= t.scrollHeight) {
      this.fetchActivities(true);
    }
  };
  /*[
    </class>

    <class name="$5WSearchListView">
  ]*/
  $5WSearchListView = function ($5w, el, type) {
    var _this = this;

    $5WView.call(this, $5w, el, type);
  };

  $5WSearchListView.prototype.search = function (ss) {
    var _this = this;

    if (this._request) {
      this._request.abort();
      delete this._request;
    }

    if (!ss) {
      $('ul', this.el).empty();
      $('ul', this.el).append('<li class="message">search your documents</li>')

      return;
    }

    this._request = this.$5w.search(ss)
      .done(function (rows) {
        $('ul', _this.el).empty();

        if (!rows.length) {
          $('ul', _this.el).append('<li class="message">no matches found</li>');
        }

        $.each(rows, function () {
          var li = $('<li><img src="img/1x1.png"/><span>' + this.value + '</span></li>')
            .attr('data-id', this.id)
            .addClass('_5w_type_' + $5w.typeFromId(this.id));

          $('ul', _this.el).append(li);
        });

        delete _this._request;
      });
  };
  /*[
    </class>

    <class name="$5WPrototypeListView">
  ]*/
  $5WPrototypeListView = function ($5w, el, type) {
    var _this = this;

    $5WView.call(this, $5w, el, type);

    var ch = new Hammer($('.fa-arrow-up', el)[0]);
    ch.on('tap', function () {
      _this.$5w.popPane();
    });

    var ol = $('fw-ordered-list', _this.el)[0];

    ol.valueAdded = _this.valueAdded = function (value) {
      _this.launchEditor(value);
    }

    ol.addEventListener('itemclicked', function (e) {
      _this.launchEditor(e.detail.itemText);
    });

    _this.refresh();
  };

  $5WPrototypeListView.prototype.refresh = function() {
    var _this = this;

    if (_this.rop && _this.rop.state() == 'pending') {
      return;
    }

    _this.rop = this.$5w.fetchView({viewName: 'document-types', limit: -1,
        group: true, reduce: true})
      .done(function (data) {
        delete _this._rop;

        var items = [];
        $(data.rows).each(function () {
          items.push(this.key);
        });

        var ol = $('fw-ordered-list', _this.el)[0];

        ol.items = items;
        ol.allowAdd = true;
      })
      .fail(function () {
        delete _this._rop;

        console.log('prototype_list: refresh failed');
      });
  }

  $5WPrototypeListView.prototype.launchEditor = function (type) {
    var pev = $5w.makeView($('<div/>'), 'prototype_editor', type);
    pev.loadType(type);
    $5w.pushPane(pev.el);
  }
  /*[
    </class>

    <class name="$5WPrototypeEditorView">
  ]*/
  class $5WPrototypeEditorView {
    constructor($5w, el, type) {
      var _this = this;

      $5WView.call(this, $5w, el, type);

      var ch = new Hammer($('.fa-arrow-up', el)[0]);
      ch.on('tap', function () {
        _this.$5w.popPane();
      });

      var th = new Hammer($('.tabbar', el)[0]);
      th.on('tap', function (e) { _this.tabTap(e); });

      var sc = new Hammer($('.editing .fa-check', el)[0]);
      sc.on('tap', function (e) { _this.saveChanges(e) });

      var dc = new Hammer($('.editing .fa-times', el)[0]);
      dc.on('tap', function (e) { _this.discardChanges(e) });

      _this.fieldList().allowAdd = true;
      _this.fieldList().allowReorder = true;

      _this.acList().allowAdd = true;
      _this.acList().allowReorder = true;
      _this.acList().allowDelete = true;

      _this.acList().addDatalist = $5WObjectType.getAllTypeNames();

      _this.el.addEventListener('itemclicked', function (e) { _this.handleListClick(e); });
      _this.el.addEventListener('listchanged', function (e) { _this.handleListChange(e); });
      _this.el.addEventListener('addinputchanged', function (e) { _this.handleAddInputChange(e); });

      var pf = _this.propertiesForm();
      pf.icon_file.addEventListener('change', function (e) { _this.handleIconFileChange(e); });

      pf.icon_url.addEventListener('input', function (e) { _this.handleIconUrlChange(e); });
    }

    saveChanges(e) {
      var _this = this;

      _this.objectType.fields = this.fieldList().items;
      _this.objectType.allow_create = this.acList().items;

      var pf = _this.propertiesForm();
      _this.objectType.proto.sort_type = pf.sort_type.value;

      _this.objectType.proto.icon_url = pf.icon_url.value;
      var de;

      try {
        de = JSON.parse(pf.display_expression.value);
      } catch (e) {
        alert('bad display expresssion JSON:' + e);

        return;
      }

      _this.objectType.proto.display_expression = de;

      _this.objectType.save()
        .done(function () {
          _this.dirty = false;
        })
        .fail(function () {
          alert('an error occurred while saving');
        });
    }

    discardChanges(e) {
      var _this = this;

      _this.loadType(_this.objectType.type);
      _this.dirty = false;
    }

    handleListClick(e) {
      var _this = this;

      var fev = _this.$5w.makeView($('<div class="_5w_popup_form"/>'), 'field_edit');

      fev.edit(_this.objectType.type, e.detail.itemText);

      _this.$5w.overlayPane(fev.el);
      _this.dirty = true;
    }

    handleListChange(e) {
      var _this = this;

      this.dirty = true;
    }

    handleAddInputChange(e) {
      var _this = this;

      _this._syncFieldNames(e.detail.input.value);
    }

    handleIconFileChange(e) {
      var _this = this;
      var pf = _this.propertiesForm();

      var fi = e.target;
      if (fi.files && fi.files[0]) {
        var r = new FileReader();

        r.onload = function (e) {
          pf.icon_url.value = e.target.result;
          _this.handleIconUrlChange(e);
        }

        r.readAsDataURL(fi.files[0]);
      }
    }

    handleIconUrlChange(e) {
      var _this = this;
      var pf = _this.propertiesForm();

      pf.icon_preview.src = pf.icon_url.value;
    }

    _syncFieldNames(search) {
      var _this = this;

      if (this._request) {
        this._request.abort();
        delete this._request;
      }

      _this._request = this.$5w.fetchView({viewName: 'field-names',
          startkey:search.toLowerCase(), endkey:search.toUpperCase() + '\u9999', limit: -1,
          group: true, reduce: true})
        .done(function (data) {
          var fields = [];

          data.rows.forEach(row => {
            fields.push(row.key);
          });

          _this.fieldList().addDatalist = fields;
        })
        .fail(function () {
          _this.fieldList().addDatalist = $5WObjectType.getAllFieldNames();
        });
    }

    set dirty(newValue) {
      var _this = this;

      _this._dirty = newValue;
      if (_this._dirty) {
        $('.editing', _this.el).removeClass('hidden');
      } else {
        $('.editing', _this.el).addClass('hidden');
      }
    }

    get dirty() {
      var _this = this;

      return _this._dirty;
    }

    get objectType() {
      return $5WObjectType.getType(this.type);
    }
  }

  $5WPrototypeEditorView.prototype.loadType = function (type) {
    var _this = this;

    _this.type = type;

    var label = _this.objectType.displayName();

    if (_this.objectType.isNew()) {
      label += ' (new)';
    }

    _this.fieldList().items = _this.objectType.fields;

    _this.acList().items = _this.objectType.allow_create;

    var pf = _this.propertiesForm();
    pf.sort_type.value = _this.objectType.proto.sort_type || 'byKey';
    pf.icon_url.value = _this.objectType.proto.icon_url || '';
    _this.handleIconUrlChange();
    var de = _this.objectType.proto.display_expression;
    pf.display_expression.value = de ? JSON.stringify(de) : '[]';

    pf.oninput =
    pf.onchange = function (e) {
      _this.dirty = true;
    }

    $('._5w_header span', _this.el).text(label);
  }

  $5WPrototypeEditorView.prototype.fieldList = function () {
    return $('.fields fw-ordered-list', this.el)[0];
  }

  $5WPrototypeEditorView.prototype.acList = function () {
    return $('.allow_create fw-ordered-list', this.el)[0];
  }

  $5WPrototypeEditorView.prototype.propertiesForm = function () {
    return $('.properties form', this.el)[0];
  }

  $5WPrototypeEditorView.prototype.tabTap = function (e) {
    if (e.target.tagName != 'LI') {
      return;
    }

    var tl = $(e.target).closest('ul.tabbar');
    if (tl.length) {
      var st = $(e.target).text().replace(' ', '_');

      $('li', tl).removeClass('selected');
      $(e.target).addClass('selected');

      $('._5w_container', this.el).addClass('hidden');
      $('._5w_container.' + st, this.el).removeClass('hidden');
      this.$5w.fixup();
    }
  };
  /*[
    </class>

    <class name="$5WDocLookupView">
  ]*/
  $5WDocLookupView = function ($5w, el, type) {
    var _this = this;

    $5WView.call(this, $5w, el, type);

    _this.search_list = _this.$5w.makeView($('.search', _this.el), 'search_list');

    $('._5w_search_box input', el).on('input', function () {
      _this.search_list.search($(this).val());
    });

    var th = new Hammer(el);
    th.on('tap', function (e) { _this.handleTap(e); });
  };

  $5WDocLookupView.prototype.handleTap = function (e) {
    var t = e.target;
    var li = $(e.target).closest('li');

    if ($(t).hasClass('fa-times')) {
      $5w.popPane();
    } if (li.length) {
      var id = $(li).attr('data-id');
      if (id) {
        $(li).trigger('5w_doc_tap', [id]);
      }
    }
  };

  $5WDocLookupView.prototype.didShow = function () {
    $('._5w_search_box input[name=search]', this.el).focus();
  };
  /*[
    </class>

    <class name="$5WAttachImageView">
  ]*/
  $5WAttachImageView = function ($5w, el, type) {
    var _this = this;

    $5WView.call(this, $5w, el, type);

    $(el).submit(function () {
      return false;
    });

    var th = new Hammer(this.el);
    th.on('tap', function (e) { _this.handleTap(e); });

    $('button', el).click(function (e) { _this.handleClick(e); });
  };

  $5WAttachImageView.prototype.setObject = function ($5wo) {
    this.$5wo = $5wo;
  };

  $5WAttachImageView.prototype.handleTap = function (e) {
    var _this = this;

    if (e.target.tagName == 'I') {
      if ($(e.target).hasClass('fa-camera')) {
          _this.captureImage(navigator.camera.PictureSourceType.CAMERA);
      } else if ($(e.target).hasClass('fa-picture-o')) {
        _this.captureImage(navigator.camera.PictureSourceType.PHOTOLIBRARY);
      }
    }
  };

  $5WAttachImageView.prototype.handleClick = function (e) {
    var _this = this;
    var camera = navigator.camera;
    var source;

    switch ($(e.target).text()) {
      case 'attach': {
        if (_this.$5wo) {
          _this.$5w.showBusy();

          var aap = _this.$5wo.addURLAttachment($('.preview img', _this.el).attr('src'));

          aap.then(function () {
              $('progress', _this.el).addClass('hidden');

              _this.$5w.hideBusy();

              _this.$5w.popPane();
            });

          $('progress', _this.el).removeClass('hidden');
          aap.fileTransfer.onprogress = function (pe) {
            $('progress', _this.el).attr('value', pe.loaded/pe.total);
          };
        }
      } break;

      case 'cancel': {
        _this.$5w.popPane();
      } break;
    }
  };

  $5WAttachImageView.prototype.captureImage = function (source) {
    var _this = this;
    var camera = navigator.camera;

    var cargs = {
      sourceType: source,
      destinationType: camera.DestinationType.FILE_URI
    };

    camera.getPicture(function (imageUri) {
        $('img', _this.el).attr('src', imageUri);
        $('button.attach').prop('disabled', false);
      }, function (message) {
        switch (message) {
          case 'no image selected': break;

          default: {
            alert(message);
          } break;
        }
      }, cargs);
  };
  /*[
    </class>

    <class name="$5WAttachImageView">
  ]*/
  class $5WAttachDocumentView {
    constructor($5w, el, type) {
      var _this = this;

      $5WView.call(this, $5w, el, type);

      $(el).submit(function () {
        return false;
      });

      $('input[type=file]', el).change(function (e) {
        $('button.attach', el)[0].disabled = e.target.files.length == 0;
      });
      $('button', el).click(function (e) { _this.handleClick(e); });
    }

    setObject($5wo) {
      this.$5wo = $5wo;
    }

    handleClick(e) {
      var _this = this;
      var camera = navigator.camera;
      var source;

      switch ($(e.target).text()) {
        case 'attach': {
          var file = $('input[type=file]', _this.el)[0].files[0];

          if (file && _this.$5wo) {
            _this.$5w.showBusy();

            var aap = _this.$5wo.addFileAttachment(file);

            aap.then(function () {
                $('progress', _this.el).addClass('hidden');

                _this.$5w.hideBusy();

                _this.$5w.popPane();
              });

            $('progress', _this.el).removeClass('hidden');
            aap.fileTransfer.onprogress = function (pe) {
              $('progress', _this.el).attr('value', pe.loaded/pe.total);
            };
          }
        } break;

        case 'cancel': {
          _this.$5w.popPane();
        } break;
      }
    }
  }
  /*[
    </class>

    <class name="$5WDatePickerView">
  ]*/
  $5WDatePickerView = function ($5w, el, type) {
    var _this = this;

    _this.type = 'datetime';

    $5WView.call(this, $5w, el, type);
    $('.picker', this.el).datewheel();
    $(this.el).bind('datewheel.changed', function () {
      _this.refresh();
    });

    var th = new Hammer(this.el);
    th.on('tap', function (e) { _this.handleTap(e); });

    _this.refresh();
  };

  $5WDatePickerView.prototype.handleTap = function (e) {
    var _this = this;

    if (e.target.tagName == 'I') {
      if ($(e.target).hasClass('fa-check')) {
        $(_this.el).trigger('5w_date_changed', [$('.picker', _this.el).datewheel('date')]);
      }

      _this.$5w.popPane();
    }
  };

  $5WDatePickerView.prototype.refresh = function () {
    var dt = $('.picker', this.el).datewheel('date');
    var fs = 'dddd M/D/YYYY' + (this.type == 'datetime' ? '<br/>hh:mm a' : '');

    $('.datetext', this.el).html(moment(dt).format(fs));
  };

  $5WDatePickerView.prototype.setType = function (type) {
    if (this.type == type) {
      return;
    }

    this.type = type;

    var cd = $('.picker', this.el).datewheel('date');
    $('.picker', this.el).replaceWith($('<div class="picker"/>'));
    $('.picker', this.el).datewheel({date: cd, showTime:type == 'datetime'});
    this.refresh();
  };

  $5WDatePickerView.prototype.getType = function () {
    return this.type;
  };

  $5WDatePickerView.prototype.setLabel = function (label) {
    $('.label', this.el).html(label);
  };

  $5WDatePickerView.prototype.getLabel = function () {
    return $('.label', this.el).html();
  };

  $5WDatePickerView.prototype.setDate = function (date) {
    $('.picker', this.el).datewheel('date', date);
    this.refresh();
  };

  $5WDatePickerView.prototype.getDate = function (date) {
    return $('.picker', this.el).datewheel('date');
  };
  /*[
    </class>

    <class name="$5WScopeView">
  ]*/
  $5WScopeView = function ($5w, el, type, min_scope) {
    var _this = this;
    this.min_scope = min_scope ? min_scope : 1;

    $5WView.call(this, $5w, el, type);

    $(el).addClass('fa').addClass($5WScopeView.scopes[1]);

    var th = new Hammer(el);
    th.on('tap', function (e) { _this.handleTap(e); });
  };

  $5WScopeView.scopes = ['fa-asterisk', 'fa-globe', 'fa-users', 'fa-user'];
  $5WScopeView.prototype.handleTap = function (e) {
    this.cycleScope();
  };

  $5WScopeView.prototype.cycleScope = function () {
    var si = this.getScopeIndex();

    this.setScopeIndex(Math.max(this.min_scope, ++si%$5WScopeView.scopes.length));
  };

  $5WScopeView.prototype.getScopeIndex = function () {
    for (var i = 0; i < $5WScopeView.scopes.length; i++) {
      if ($(this.el).hasClass($5WScopeView.scopes[i])) {
        return Math.max(i, this.min_scope);
      }
    }

    return -1;
  };

  $5WScopeView.prototype.getScopeName = function () {
    return $5WSMS.scopes[this.getScopeIndex()];
  };

  $5WScopeView.prototype.setScopeIndex = function (scope) {
    scope = Math.max(this.min_scope, scope);
    for (var i = 0; i < $5WScopeView.scopes.length; i++) {
      $(this.el).removeClass($5WScopeView.scopes[i]);
    }

    $(this.el).addClass($5WScopeView.scopes[scope]);
  };
  /*[
    </class>

    <class name="$5WSMS">
  ]*/
  $5WSMS = function ($5w, store_name) {
    this.$5w = $5w;
    this.store_name = store_name;
  };

  $5WSMS.scopes = ['default', 'global', 'object', 'user'];
  $5WSMS.scopeIndex = function (scope) {
    return $5WSMS.scopes.indexOf(scope);
  };

  $5WSMS.deepSet = function (o, keys, value) {
    var _o = o;
    var k;

    for (var i = 0; i < keys.length-1; i++) {
      k = keys[i];

      if (!(k in o)) {
        o[k] = {};
      }

      o = o[k];
    }

    o[keys[i]] = value;

    return _o;
  };

  $5WSMS.prototype._init = function () {
    var _this = this;

    function createStore() {
      var store = {_id:'$5w_sms'};
      $.each($5WSMS.scopes, function () {
        store[this] = {};
      });

      return store;
    }

    this.store = createStore();

    return this.$5w.fetchObject('$5w_sms')
      .done(function (data) {
          _this.store = data;
        });
  };

  $5WSMS.prototype.walkMetadata = function (objectName, fieldName, callback) {
    if (!callback) {
      callback = function (scope, mdo, so) { $.extend(mdo, so); };
    }

    var keys = [this.$5w.user_info.name, objectName, fieldName];
    var mdo = {};

    for (var s = 0; s < $5WSMS.scopes.length; s++) {
      var so = this.store[$5WSMS.scopes[s]];
      var ki = keys.length - s;

      if (ki >= keys.length) {
        callback($5WSMS.scopes[s], mdo, so);
      } else {
        while (ki < keys.length && keys[ki] in so) {
          so = so[keys[ki]];
          ki++;
        }

        if (ki == keys.length) {
          callback($5WSMS.scopes[s], mdo, so);
        }
      }
    }

    return mdo;
  };

  $5WSMS.prototype.getMetadataScope = function (objectName, fieldName) {
    return this.walkMetadata(objectName, fieldName, function (scope, mdo, so) {
      $.each(so, function (key) {
        mdo[key] = scope;
      });
    });
  };

  $5WSMS.prototype.getMetadata = function (objectName, fieldName) {
    return this.walkMetadata(objectName, fieldName, function (s, mdo, so) { $.extend(mdo, so); });
  };

  $5WSMS.prototype.clearMetadata = function (scope, objectName, fieldName, key) {
    var keys = [this.$5w.user_info.name, objectName, fieldName];
    var ss = $5WSMS.scopeIndex(scope);

    for (var s = $5WSMS.scopes.length-1; s >= ss; s--) {
      var so = this.store[$5WSMS.scopes[s]];
      var ki = keys.length - s;

      if (ki >= keys.length) {
        delete so[key];
      } else {
        while (ki < keys.length && keys[ki] in so) {
          so = so[keys[ki]];
          ki++;
        }

        if (ki == keys.length) {
          delete so[key];
        }
      }
    }
  };

  $5WSMS.prototype.setMetadata = function (scope, objectName, fieldName, key, value) {
    this.clearMetadata(scope, objectName, fieldName, key);
    var si = $5WSMS.scopeIndex(scope);

    var keys = [this.$5w.user_info.name, objectName, fieldName, key];
    $5WSMS.deepSet(this.store[scope], keys.slice(keys.length-si-1), value);
  };

  $5WSMS.prototype.saveStore = function () {
    var _this = this;

    return this.$5w.saveObject(this.store)
      .done(function (data) {
          if (data.ok) {
            _this.store._rev = data.rev;
          }
        })
      .fail(function () {
        alert('Your field edits were not saved, there was a conflict with another user.');
      });
  };
  /*[
    </class>

    <class name="$5W" singletonName="$5w">
  ]*/
  $5W = function (dburl) {
    this.dburl = dburl;
    this.busy_count = 0;
    this._namecache = getLocal('_namecache', {});
    this.extensions = [];
  };

  $5W.prototype._init = function () {
    var _this = this;

    _this.html = $('#5w_templates')[0];

    var op = $5WObjectType.refresh();

    var th = new Hammer($('._5w')[0], {preventDefault: true});
    th.on('tap', _this._5w_touch);

    callAll(_this.extensions, '_init', [_this]);
  };

  $5W.prototype.addExtension = function(eo) {
    if (this.extensions.indexOf(eo) < 0) {
      this.extensions.push(eo);
    }
  };

  $5W.prototype.login = function (username, password) {
    var _this = this;
    var checkOnly = !username;

    this.showBusy();

    $.ajax({
      type: checkOnly ? 'GET' : 'POST',
      url: this.dburl + '/_session',
      data: {'name': username, 'password': password},
      dataType: 'json'
    })
      .done(function (data) {
        data = data.userCtx || data;

        if (checkOnly && !data.name) {
          _this.hideBusy();

          $(document).trigger('5w_not_logged_in');

          return;
        }

        username = data.name;

        _this.user_info = data;
        _this.fetchObject('User_' + username)
          .done(function (data, textStatus, jqXHR) {
              _this.hideBusy();
              _this.user_info.doc_id = data._id;
              _this._loadConfig();
            })
          .fail(function () {
            _this.hideBusy();

            $(document).trigger('5w_login_fail',
              'No account found for \'' + username + '\'. Please contact your administrator.'
            );
          });
      });
  };

  $5W.prototype.isLoggedIn = function () {
    return 'user_info' in this;
  };

  $5W.prototype.refreshSession = function () {
    var _this = this;
    $.ajax({
      type: 'GET',
      url: _this.dburl + '/_session',
    })
      .done(function (data) {
        if (!(data.userCtx && data.userCtx.name)) {
          if (_this.isLoggedIn()) {
            delete _this.user_info;
            $(document).trigger('5w_logout');
          }
        }
      });
  }

  $5W.prototype.isAdmin = function () {
    return 'user_info' in this
      && (
        findString('administrator', this.user_info.roles) >= 0
        || findString('_admin', this.user_info.roles) >= 0
      );
  };

  $5W.prototype.logout = function () {
    var _this = this;

    $.ajax({
      type: 'DELETE',
      url: this.dburl + '/_session',
    })
      .done(function () {
        delete _this.user_info;
        $(document).trigger('5w_logout');
      });
  };

  $5W.prototype.rootObjectTypes = function () {
    var ot = $5WObjectType.getType('User');

    return ot.proto && ot.proto.allow_create;
  }

  $5W.prototype.showBusy = function () {
    this.busy_count++;

    if (this.busy_count <= 0) {
      this.busy_count = 1;
    }

    if ($('._5w_busy').length <= 0) {
      $('body').append('<div class="_5w_busy">&nbsp;</div>');
    }
  };

  $5W.prototype.hideBusy = function () {
    this.busy_count--;

    if (this.busy_count > 0) {
      return;
    }

    $('._5w_busy').remove();
  };

  $5W.prototype._5w_touch = function (e) {
    var t = e.target;

    if ($(t).hasClass('_5w_doc_link')) {
      $(t).trigger('5w_open_object', [$(t).attr('data-id'),
          $(t).hasClass('_5w_push') ? 'push' : 'jump']);
    }
  };

  $5W.prototype._loadConfig = function () {
    this._sms = new $5WSMS(this, 'fields');
    this._sms._init();
    $(document).trigger('5w_login');
  };

  $5W.prototype._handleAjaxError = function (jqXHR, textStatus, errorThrown) {
    var rj = jqXHR.responseJSON;
    alert(rj.error + ': ' + rj.reason);
  };

  $5W.prototype.version = function () {
    return [1, 0];
  };

  $5W.prototype.typeFromId = function (id) {
    var i = id && id.lastIndexOf('_');

    return i > 0 ? id.substr(0, i) : null;
  };

  $5W.viewTypes = {'view':$5WView, 'login':$5WLoginView, 'browser':$5WBrowserView
      , 'page':$5WPageView, 'viewer':$5WViewerView
      , 'doc_lookup':$5WDocLookupView
      , 'date_picker':$5WDatePickerView
      , 'attach_image':$5WAttachImageView
      , 'attach_document':$5WAttachDocumentView
      , 'scope':$5WScopeView, 'field':$5WFieldView
      , 'field_edit':$5WFieldEditView, 'doc_slug':$5WDocSlugView
      , 'activity':$5WActivityView, 'activity_list':$5WActivityListView
      , 'related':$5WRelatedView
      , 'search_list':$5WSearchListView
      , 'prototype_list':$5WPrototypeListView
      , 'prototype_editor':$5WPrototypeEditorView};

  $5W.prototype.makeView = function (el, type) {
    var _this = this;

    if (!(type in $5W.viewTypes)) {
      return undefined;
    }

    var av = [];

    $.each(el, function () {
      var $5wview = $(this).data('$5wview');
      if (!$5wview) {
        $5wview = new $5W.viewTypes[type](_this, this, type);
      }

      av.push($5wview);
    });

    return av.length == 1 ? av[0] : av;
  };

  $5W.prototype.fetchView = function (viewName, startkey, limit, endkey, designDoc) {
    designDoc = designDoc || "_design/5w";
    var vp = {};

    if (typeof viewName === 'object') {
      $.extend(vp, viewName);
      viewName = vp.viewName;
      delete vp.viewName;
      if (vp.hasOwnProperty('designDoc')) {
        designDoc = vp.designDoc;
        delete vp.designDoc;
      }
    } else {
      vp.startkey = startkey;
      vp.limit = limit;
      vp.endkey = endkey;
    }

    if (!vp.limit) {
      vp.limit = 30;
    } else if (vp.limit < 0) {
      delete vp.limit;
    }

    $.each(['key', 'startkey', 'endkey'], function () {
      if (vp.hasOwnProperty(this)) {
        vp[this] = JSON.stringify(vp[this]);
      }
    });

    return $.ajax({
      url: this.dburl + '/' + designDoc + '/_view/' + viewName,
      data: vp,
      dataType: 'json'
    });
  };

  $5W.prototype.search = function (ss) {
    function filterDups(rows) {
      var s = new Set();

      return rows.filter(row => {
        if (s.has(row.id)) {
          return false;
        }

        s.add(row.id);

        return true;
      });
    }
    var sra = callReturnAll(this.extensions, 'search', [ss]);

    var va = {viewName:"5wo_search", designDoc:"_design/5ws", startkey:ss.toLowerCase(), endkey:ss.toUpperCase() + '\u9999'};
    var vap = this.fetchView(va);
    sra.push(vap);

    var scd = new $.Deferred();

    $.when.apply($, sra)
      .done(function () {
          var args = Array.prototype.slice.call(arguments);

          if (sra.length > 1) {
            var rows = [];

            for (var i = 0; i < args.length; i++) {
              rows = rows.concat(args[i][0].rows);
            }

            rows.sort(function (a, b) {
              return a.key.localeCompare(b.key);
            });

            scd.resolve(filterDups(rows));
          } else {
            scd.resolve(filterDups(args[0].rows));
          }
        })
      .fail(function () {
        scd.reject();
      });

    var scp = scd.promise();
    scp.abort = function () {
      for (var i = 0; i < sra.length; i++) {
        sra[i].abort();
      }
    };

    return scp;
  };

  $5W.prototype.makeNewObject = function (type) {
    return $5WObjectType.makeNew(type);
  }

  $5W.prototype.getNewId = function (type) {
    if (!type || !this.isLoggedIn()) {
      return null;
    }

    var eh = ('0000' + this.user_info.name.hashCode().toString(16)).substr(-4);
    var d = Date.now();

    return type + '_' + eh + ('0000000000000000' + d.toString(16)).substr(-16);
  };

  $5W.prototype.getDisplayName = function (id) {
    return id in this._namecache ? this._namecache[id] : null;
  };

  $5W.prototype.getObjectUrl = function (id) {
    return this.dburl + '/' + id;
  };

  $5W.prototype.fetchObject = function (id) {
    if (!id) {
      return (new $.Deferred()).reject('missing id');
    }

    var fop = new $.Deferred();

    var _this = this;

    var fr = callReturnFirst(this.extensions, 'fetchObject', [id]);

    if (!fr) {
      fr = $.ajax({
            url: this.dburl + '/' + id,
            dataType: 'json'
          });
    }

    fr.done(function (data, textStatus, jqXHR) {
        var dt = _this.typeFromId(id);
        if (dt && dt != '$5w') {
          var $5wo = new $5WObject(data);

          _this._namecache[id] = $5wo.displayName();
          setLocal('_namecache', _this._namecache);
        }

        fop.resolve(data, textStatus, jqXHR);
      })
      .fail(function () {
        fop.reject();
      });

    return fop;
  };

  $5W.prototype.fetchObjectRange = function (start_id, end_id) {
    var _this = this;

    if (typeof end_id == 'undefined') {
      end_id = start_id + '\\u9999';
    }

    var fr = $.ajax({
      url: this.dburl + '/_all_docs?include_docs=true&startkey="'
          + start_id + '"&endkey="'
          + end_id + '"',
      dataType: 'json'
    });

    return fr;
  };

  $5W.prototype.getActivities = function (id) {
    var qa = {"descending":true, "include_docs":true};

    if (!id) {
      qa.viewName = 'activities';
    } else {
      qa.viewName = 'object-activities';
      qa.startkey = [this.typeFromId(id), id+'\u9999'];
      qa.endkey = [this.typeFromId(id), id];
    }

    return this.fetchView(qa);
  };

  $5W.prototype.getRelatedObjects = function (id) {
    // !!!CLEANUP!!! this pattern is also used in the search()
    // method. Should be refactored to call a common worker method.
    var sra = callReturnAll(this.extensions, 'getRelatedObjects', [id]);

    var va = {viewName:'related', key:id, limit:500, include_docs:true};
    var vap = this.fetchView(va);
    sra.push(vap);

    var scd = new $.Deferred();

    $.when.apply($, sra)
      .done(function () {
          var args = Array.prototype.slice.call(arguments);

          var rows;

          if (sra.length > 1) {
            rows = [];

            for (var i = 0; i < args.length; i++) {
              rows = rows.concat(args[i][0].rows);
            }
          } else {
            rows = args[0].rows;
          }

          rows.sort(function (a, b) {
            var at = $5w.typeFromId(a.id);
            var bt = $5w.typeFromId(b.id);

            if (at != bt) {
              return at.localeCompare(bt);
            }

            var tp = $5WObjectType.getType(at).getProto();
            var st = tp.sort_type || 'byKey';

            switch (st) {
              case 'displayName': {
                var ao = new $5WObject(a.doc);
                var bo = new $5WObject(b.doc);

                return ao.displayName().localeCompare(bo.displayName());
              }

              case 'mostRecent': {
                var alm = a.doc.LastModifiedDate;
                var blm = b.doc.LastModifiedDate;

                return blm.localeCompare(alm);
              }
            }

            return a.id.localeCompare(b.id);
          });

          scd.resolve(rows);
        })
      .fail(function () {
        scd.reject();
      });

    var scp = scd.promise();
    scp.abort = function () {
      for (var i = 0; i < sra.length; i++) {
        sra[i].abort();
      }
    };

    return scp;
  };

  $5W.prototype.saveObject = function (o) {
    var _this = this;

    var sop = callReturnFirst($5w.extensions, 'saveObject', [o]);

    if (!sop) {
      sop = $.ajax({
              type: 'PUT',
              url: this.dburl + '/' + o._id,
              data: JSON.stringify(o),
              dataType: 'json'
            });
    }

    sop.done(function () {
      delete _this._namecache[o._id];
      setLocal('_namecache', _this._namecache);
    });

    return sop;
  };

  $5W.prototype.fixup = function () {
    this._checkFixups();
  };

  $5W.prototype.pushPane = function (pane) {
    var _this = this;
    _this.showBusy();

    document.activeElement.blur();
    var vl = $('._5w>div:visible');
    $('._5w_active_pane').removeClass('_5w_active_pane');

    $(vl).slideUp('fast', function () {
        $(vl).notify5WView('didHide');
        $('._5w').append(pane).notify5WView('willShow');
        _this._checkFixups();
        $(pane).slideDown('fast', function () {
            _this.hideBusy();
            $(pane).trigger('5w_pane_visible');
            $(pane).notify5WView('didShow');
            $(pane).addClass('_5w_active_pane');
          });
      }).notify5WView('willHide');
  };

  $5W.prototype.overlayPane = function (pane) {
    var _this = this;
    _this.showBusy();

    $('._5w_active_pane').removeClass('_5w_active_pane');

    document.activeElement.blur();
    $('._5w>div:last').notify5WView('willHide').notify5WView('didHide');
    $('._5w').append(pane);
    $(pane).notify5WView('willShow');
    _this._checkFixups();
    $(pane).slideDown(function () {
        _this.hideBusy();
        $(pane).trigger('5w_pane_visible');
        $(pane).notify5WView('didShow');
        $(pane).addClass('_5w_active_pane');
      });
  };

  $5W.prototype.popPane = function () {
    document.activeElement.blur();
    $('._5w_active_pane').removeClass('_5w_active_pane');

    $('._5w>div:last').notify5WView('willHide').slideUp(function () {
        $(this).notify5WView('didHide');
        $(this).remove();
      });
    $('._5w>div:nth-last-child(2)').notify5WView('willShow').slideDown(function () {
      $(this).addClass('_5w_active_pane');
      $(this).notify5WView('didShow');
    });
  };

  $5W.prototype.replacePane = function (pane) {
    var _this = this;

    _this.showBusy();
    document.activeElement.blur();
    $('._5w_active_pane').removeClass('_5w_active_pane');

    $('._5w>div:last').notify5WView('willHide').slideUp(function () {
        $(this).notify5WView('didHide').remove();
        $('._5w').append(pane).notify5WView('willShow');
        $(pane).slideDown(function () {
            _this.hideBusy();
            $(pane).trigger('5w_pane_visible');
            $(pane).addClass('_5w_active_pane');
            $(pane).notify5WView('didShow');
          });
    });
  };

  $5W.prototype.isActivePane = function (pane) {
    return $(pane).is('._5w_active_pane');
  };

  $5W.prototype._checkFixups = function () {
    var _this = this;

    if (_this._fixup_request) {
      return;
    }

    var fxl = $('._5w_fixup');

    if (fxl.length <= 0) {
      return;
    }

    var ida = [];

    $.each(fxl, function () {
      switch ($(this).attr('data-fixup')) {
        case '5w_fixup_docref': {
          var id = $(this).attr('data-id');
          var dn = _this.getDisplayName(id);
          if (dn) {
            $(this).text(dn);
            $(this).removeClass('_5w_fixup');
          } else {
            if (!_this._fixup_request) {
              _this._fixup_request = _this.fetchObject(id)
                  .done(function () {
                      delete _this._fixup_request;
                      _this._checkFixups();
                    })
                  .fail(function () {
                      delete _this._fixup_request;
                    });
            }
          }
        } break;
      }
    });
  };
  /*[
    </class>
  ]*/
}());
/*[
  </package>
]*/
