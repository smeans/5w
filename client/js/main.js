var $5w = new $5W('/data');

class MainApp {
  constructor() {
    this.bindEvents();

    $5w._init();

    $5w.login();
  }

  isUIBusy() {
  return this._uibusy > 0;
  }

  enterUIBusy() {
    this._uibusy++;
  }

  leaveUIBusy() {
    this._uibusy--;
  }

  startSessionRefresh() {
    var _this = this;
    if (_this._refreshTimer) {
      return;
    }

    _this._refreshTimer = setInterval(function () {
      if ($5w.isLoggedIn()) {
        $5w.refreshSession();
      } else {
        _this.stopSessionRefresh();
      }
    }, 60000);
  }

  stopSessionRefresh() {
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
      delete this._refreshTimer;
    }
  }

  bindEvents() {
    $(document).on('5w_login', this.on5wLogin);
    $(document).on('5w_not_logged_in', this.on5wNotLoggedIn);
    $(document).on('5w_login_fail', this.on5wLoginFail);
    $(document).on('5w_logout', this.on5wLogout);

    $(document).on('5w_open_menu', this.on5wOpenMenu);
    $(document).on('5w_open_object', this.on5wOpenObject);

    $(document).on('5w_launch_address', function (e, ea) { theApp.on5wLaunchAddress(e, ea); });
    $(document).on('5w_launch_phone', function (e, ea) { theApp.on5wLaunchPhone(e, ea); });
    $(document).on('5w_launch_mobile', function (e, ea) { theApp.on5wLaunchPhone(e, ea); });
    $(document).on('5w_launch_sms', function (e, ea) { theApp.on5wLaunchSms(e, ea); });

    $(document).on('5w_launch_email', this.on5wLaunchEmail);

    var mmh = new Hammer($('nav')[0]);
    mmh.on('tap', this.onMainMenuTap);

    var clh = new Hammer($('.content_layer')[0]);
    clh.on('tap', function (e) { theApp.hideMenu(); });
  }

  on5wLogin() {
    $('body').addClass('logged_in');
    if ($5w.isAdmin()) {
      $('body').addClass('is_admin');
    }

    if (!$('._5w>.browser').length) {
      var bv = $5w.makeView($('<div class="browser"/>'), 'browser');
      $5w.replacePane(bv.el);
    } else {
      $5w.popPane();
    }

    theApp.startSessionRefresh();
  }

  on5wNotLoggedIn() {
    var lv = new $5WLoginView($5w, $('<div class="login _5w_popup_form"/>'),
      'login');
    $5w.overlayPane(lv.el);
  }

  on5wLoginFail(e, message) {
    $('.login_error p').text(message);

    theApp.overlayPage('login error', 'login_error');
  }

  on5wLogout() {
    $('.logged_in').removeClass('logged_in');
    $('.is_admin').removeClass('is_admin');

    location.reload();
  }

  on5wOpenMenu(e, viewObject) {
    theApp.showMenu(viewObject);
  }

  onMainMenuTap (e) {
    if (e.target.tagName == 'LI') {
      var mt = $(e.target).text().trim();
      switch (mt) {
        case 'my profile': {
          theApp.hideMenu();
          theApp.viewProfile();
        } break;

        case 'prototype editor': {
          if (!$5w.isAdmin()) {
            return;
          }

          theApp.hideMenu();

          var v = $5w.makeView($('<div/>'), 'prototype_list');
          $5w.pushPane(v.el);
        } break;

        case 'logout': {
          $5w.logout();

          theApp.hideMenu();
        } break;

        default: {
          var ot = $(e.target).attr('data-type');

          if (ot) {
            theApp.hideMenu();

            theApp.newObject(ot);
          }
        } break;
      }
    }
  }

  on5wOpenObject(e, id, method) {
    if (theApp.isUIBusy() || $('._5w ._5w_view_viewer._5w_active_pane[data-id=\'' + id + '\']').length) {
      return;
    }

    theApp.enterUIBusy();
    var ov = $('._5w ._5w_view_viewer[data-id=\'' + id + '\']');
    if (ov.length) {
      $(ov).remove();
      $5w.pushPane(ov[0]);
      theApp.leaveUIBusy();
    } else {
      var v = $5w.makeView($('<div/>'), 'viewer');
      $(v.el).attr('data-id', id);
      v.loadObject(id)
        .done(function () {
            if (method == 'jump') {
              $5w.popPane();
            }
            $5w.pushPane(v.el);
            theApp.leaveUIBusy();
          })
        .fail(function () {
            alert('error loading document, please try again later');
            theApp.leaveUIBusy();
          });
    }
  }

  on5wLaunchAddress(e, ea) {
    theApp.launchActivity(e, ea, 'VisitActivity', 'Visited ' + ea.$5wo.displayName() + '.');
  }

  on5wLaunchSms(e, ea) {
    theApp.launchActivity(e, ea, 'SMSActivity', 'Texted number ' + ea.phone + '.');
  }

  on5wLaunchPhone(e, ea) {
    theApp.launchActivity(e, ea, 'PhoneActivity', 'Used number ' + ea.phone + '.');
  }

  on5wLaunchEmail(e, ea) {
    theApp.launchActivity(e, ea, 'EmailActivity', 'Emailed ' + ea.email + '.');
  }

  newObject(type) {
    var ov = $('<div/>');
    var v = $5w.makeView(ov, 'viewer');
    var pao = $5w.makeNewObject(type);

    v.loadObject(pao)
      .done(function () {
        $5w.pushPane(v.el);
        v.startEditing();
      });
  }

  launchActivity(e, ea, type, note) {
    var ov = $('<div/>');
    var v = $5w.makeView(ov, 'viewer');
    var pao = $5w.makeNewObject(type);
    pao.IsActivity = true;
    pao.TargetId = ea.$5wo.id();
    pao.Note = note;

    v.loadObject(pao)
      .done(function () {
        $5w.pushPane(v.el);
        v.startEditing();
      });
  }

  viewProfile(type) {
    var ov = $('<div/>');
    var v = $5w.makeView(ov, 'viewer');

    v.loadObject($5w.user_info.doc_id)
      .done(function () {
        theApp.hideMenu();
        $5w.pushPane(v.el);
      });
  }

  showPage(title, page) {
    var v = $5w.makeView($('<div/>'), 'page');
    v.setContent(title, $('.' + page).html());
    $5w.pushPane(v.el);
  }

  showMenu(viewObject) {
    if ($('.menuView').length) {
      return;
    }

    document.activeElement.blur();

    var view = viewObject.el;

    $(view).addClass('menuView');

    $('nav ul.new_items').empty();

    var otl = $5w.rootObjectTypes();
    if (otl) {
      otl.forEach(ot => {
        $('nav ul.new_items').append('<li data-type="' + ot + '">new ' + titleCaseToHuman(ot) + '</li>');
      });
    }

    $('.content_layer, nav').addClass('active');
  }

  hideMenu() {
    var view =$('.menuView');

    if (!view.length) {
      return;
    }

    $('.content_layer, nav').removeClass('active');
    $(view).removeClass('menuView');
  }

  overlayPage(title, page) {
    var v = $5w.makeView($('<div/>'), 'page');
    v.setContent(title, $('.' + page).html());
    $5w.overlayPane(v.el);
  }
}

var theApp;

$(function () {
  theApp = new MainApp();
});
