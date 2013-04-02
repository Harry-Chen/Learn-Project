// Generated by IcedCoffeeScript 1.4.0c
(function() {
  var db_clearCache, db_fixOldMess, db_get, db_getPassword, db_getUsername, db_saveToken, db_set, db_setAllReaded, db_setState, db_updateCourseList, db_updateList, errorEnum, errorHandler, evaluation, filterCourse, iced, load, mergeList, net_getCourseList, net_login, net_submitServer, parser, prepareCollectList, prepareNormalList, processCourseList, state, traverseCourse, version_control, __iced_k, __iced_k_noop,
    __slice = [].slice;

  iced = {
    Deferrals: (function() {

      function _Class(_arg) {
        this.continuation = _arg;
        this.count = 1;
        this.ret = null;
      }

      _Class.prototype._fulfill = function() {
        if (!--this.count) return this.continuation(this.ret);
      };

      _Class.prototype.defer = function(defer_params) {
        var _this = this;
        ++this.count;
        return function() {
          var inner_params, _ref;
          inner_params = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          if (defer_params != null) {
            if ((_ref = defer_params.assign_fn) != null) {
              _ref.apply(null, inner_params);
            }
          }
          return _this._fulfill();
        };
      };

      return _Class;

    })(),
    findDeferral: function() {
      return null;
    },
    trampoline: function(_fn) {
      return _fn();
    }
  };
  __iced_k = __iced_k_noop = function() {};

  parser = new DOMParser();

  errorEnum = ['noToken', 'netFail'];

  state = {
    tabId: null
  };

  errorHandler = function(type) {
    return chrome.tabs.sendMessage(state.tabId, {
      'type': type
    });
  };

  net_login = function(successCall) {
    var password, username;
    username = db_getUsername();
    password = db_getPassword();
    if (!username || !password) {
      errorHandler('noToken');
      return;
    }
    return $.post(URL_CONST['login'], {
      'userid': username,
      'userpass': password
    }, function(data) {
      return window.setTimeout(successCall, 1000);
    }).fail(function() {
      return errorHandler('netFail');
    });
  };

  db_getUsername = function() {
    return localStorage.getItem('learn_username', '');
  };

  db_getPassword = function() {
    var password;
    password = localStorage.getItem('learn_encrypt_password', '');
    if (!password) return password;
    return sjcl.decrypt("LEARNpassword", password);
  };

  net_getCourseList = function(callback) {
    return $.get(URL_CONST['course'], function(data) {
      var courseDocument, courseList;
      courseDocument = parser.parseFromString(data, 'text/html');
      courseList = courseDocument.querySelectorAll('#info_1 a');
      courseList = Array.prototype.slice.call(courseList);
      return db_updateCourseList(courseList, callback);
    }).fail(errorHandler('netFail'));
  };

  net_submitServer = function() {};

  db_set = function(key, value, callback) {
    var tmp;
    tmp = {};
    tmp[key] = JSON.stringify(value);
    return chrome.storage.local.set(tmp, callback);
  };

  db_get = function(key, defaultValue, callback) {
    return chrome.storage.local.get(key, function(result) {
      if (result[key] === void 0) callback(defaultValue);
      return callback(JSON.parse(result[key]));
    });
  };

  db_fixOldMess = function() {
    var d, key, passwordTemp, temp, value;
    if (version_control('check', 1)) {
      passwordTemp = localStorage.getItem('learn_passwd');
      if (passwordTemp) {
        localStorage.removeItem('learn_passwd');
        old_db_saveToken(old_db_getUsername(), passwordTemp);
      }
      version_control('set', 1);
    }
    if (version_control('check', 2)) {
      d = localStorage.getItem('deadline_list');
      if (d) {
        d = JSON.parse(d);
        for (key in d) {
          value = d[key];
          if (value.type) break;
          value.type = 'd';
          value.id = value.deadlineId;
        }
        localStorage.setItem('deadline_list', JSON.stringify(d));
      }
      d = localStorage.getItem('notification_list');
      if (d) {
        d = JSON.parse(d);
        for (key in d) {
          value = d[key];
          if (value.type) break;
          value.type = 'n';
        }
        localStorage.setItem('notification_list', JSON.stringify(d));
      }
      version_control('set', 2);
    }
    if (true || version_control('check', 3)) {
      d = localStorage.getItem('deadline_list');
      temp = {};
      if (d) {
        d = JSON.parse(d);
        for (key in d) {
          value = d[key];
          temp[key] = value;
          temp[key].start = new Date(value.start);
          temp[key].end = new Date(value.end);
        }
        db_set('deadline_list', temp);
      }
      d = localStorage.getItem('notification_list');
      if (d) {
        d = JSON.parse(d);
        for (key in d) {
          value = d[key];
          temp[key] = value;
          temp[key].day = new Date(value.day);
        }
        db_set('notification_list', temp);
      }
      d = localStorage.getItem('file_list');
      if (d) {
        d = JSON.parse(d);
        for (key in d) {
          value = d[key];
          temp[key] = value;
          temp[key].day = new Date(value.day);
        }
        db_set('file_list', temp);
      }
      localStorage.removeItem('deadline_list');
      localStorage.removeItem('notification_list');
      localStorage.removeItem('file_list');
      return version_control('set', 3);
    }
  };

  version_control = function(op, version) {
    var cur;
    if (op === 'check') {
      cur = localStorage.getItem('learn_version_flag', '0');
      if (version > cur) {
        return true;
      } else {
        return false;
      }
    }
    if (op === 'set') return localStorage.setItem('learn_version_flag', version);
  };

  db_updateCourseList = function(courseList, callback) {
    var db_courseList, i, id, name, _i, _ref;
    db_courseList = [];
    for (i = _i = 0, _ref = courseList.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      id = getURLParamters(courseList[i].getAttribute('href')).course_id;
      name = $.trim(courseList[i].innerText);
      name = name.match(/^(.*)\s*\([^(]*\)\s*\([^(]*\)$/)[1];
      db_courseList.push({
        'id': id,
        'name': name
      });
    }
    localStorage.setItem('course_list', JSON.stringify(db_courseList));
    if (callback) return callback(db_courseList);
  };

  db_saveToken = function(username, password) {
    var encryptPassword;
    localStorage.setItem('learn_username', username);
    encryptPassword = sjcl.encrypt("LEARNpassword", password);
    return localStorage.setItem('learn_encrypt_password', encryptPassword);
  };

  db_updateList = function(type, list, callback, collectCallback, finishCallback) {
    var oldList, ___iced_passed_deferral, __iced_deferrals, __iced_k, _name,
      _this = this;
    __iced_k = __iced_k_noop;
    ___iced_passed_deferral = iced.findDeferral(arguments);
    _name = CONST.cacheListName[type];
    if (!_name) return;
    (function(__iced_k) {
      __iced_deferrals = new iced.Deferrals(__iced_k, {
        parent: ___iced_passed_deferral,
        filename: "background.iced",
        funcname: "db_updateList"
      });
      db_get(_name, {}, __iced_deferrals.defer({
        assign_fn: (function() {
          return function() {
            return oldList = arguments[0];
          };
        })(),
        lineno: 156
      }));
      __iced_deferrals._fulfill();
    })(function() {
      if (oldList) list = mergeList(list, oldList);
      db_set(_name, list);
      return callback && callback(type, list, collectCallback, finishCallback);
    });
  };

  db_setState = function(type, id, targetState) {
    var list, ___iced_passed_deferral, __iced_deferrals, __iced_k, _name,
      _this = this;
    __iced_k = __iced_k_noop;
    ___iced_passed_deferral = iced.findDeferral(arguments);
    if (!(id && type && targetState)) return;
    _name = CONST.cacheListName[type];
    (function(__iced_k) {
      __iced_deferrals = new iced.Deferrals(__iced_k, {
        parent: ___iced_passed_deferral,
        filename: "background.iced",
        funcname: "db_setState"
      });
      db_get(_name, {}, __iced_deferrals.defer({
        assign_fn: (function() {
          return function() {
            return list = arguments[0];
          };
        })(),
        lineno: 166
      }));
      __iced_deferrals._fulfill();
    })(function() {
      if (!list) return;
      list[id].state = targetState;
      return db_set(_name, list);
    });
  };

  db_clearCache = function(type) {
    return db_set(CONST.cacheListName[type], '');
  };

  db_setAllReaded = function(type) {
    var key, list, ___iced_passed_deferral, __iced_deferrals, __iced_k, _name,
      _this = this;
    __iced_k = __iced_k_noop;
    ___iced_passed_deferral = iced.findDeferral(arguments);
    _name = CONST.cacheListName[type];
    (function(__iced_k) {
      __iced_deferrals = new iced.Deferrals(__iced_k, {
        parent: ___iced_passed_deferral,
        filename: "background.iced",
        funcname: "db_setAllReaded"
      });
      db_get(_name, {}, __iced_deferrals.defer({
        assign_fn: (function() {
          return function() {
            return list = arguments[0];
          };
        })(),
        lineno: 175
      }));
      __iced_deferrals._fulfill();
    })(function() {
      for (key in list) {
        if (!list[key] === 'stared') list[key].state = 'readed';
      }
      return db_set(_name, list);
    });
  };

  mergeList = function(newList, oldList) {
    var key, temp, value;
    if (!oldList) return newList;
    temp = {};
    for (key in oldList) {
      value = oldList[key];
      if (newList[key]) {
        temp[key] = newList[key];
        temp[key].state = value.state;
      }
    }
    for (key in newList) {
      value = newList[key];
      if (!oldList[key]) temp[key] = value;
    }
    return temp;
  };

  evaluation = function(type, entry) {
    var dueDays, e, read_status_priority, today;
    today = new Date();
    e = 0;
    read_status_priority = {
      'readed': CONST.evalFlag.READED,
      'unread': CONST.evalFlag.UNREAD,
      'stared': CONST.evalFlag.STARED
    };
    e += read_status_priority[entry.state];
    if (type === 'deadline') {
      e += CONST.evalFlag.HOMEWORK;
      dueDays = Math.floor((new Date(entry.end) - today) / (60 * 60 * 1000 * 24));
      entry['dueDays'] = dueDays;
      if (dueDays < 0) {
        e += CONST.evalFlag.EXPIRED;
      } else {
        e += dueDays;
      }
      if (entry.submit_state === CONST.stateTrans.submitted) {
        e += CONST.evalFlag.SUBMIT_FLAG;
      }
      if (dueDays === 0) e += CONST.evalFlag.HOMEWORK_TODAY;
    } else if ((type === 'notification') || (type === 'file')) {
      dueDays = Math.floor((new Date(entry.day) - today) / (60 * 60 * 1000 * 24));
      e -= dueDays;
    }
    entry['eval'] = e;
    return entry;
  };

  filterCourse = function(list, type) {
    var courseFliter, _name;
    if (!type) return list;
    _name = CONST.ignoreListName[type];
    if (!_name) return list;
    courseFliter = [];
    if (localStorage.getItem(_name)) {
      courseFliter = JSON.parse(localStorage.getItem(_name));
    }
    list = list.filter(function(x) {
      return courseFliter.indexOf(x.id) < 0;
    });
    return list;
  };

  processCourseList = function(update, callback, progressCallback) {
    var courseList;
    progressCallback && progressCallback(0);
    courseList = localStorage.course_list;
    if (!courseList && update) {
      net_getCourseList((progressCallback ? function() {
        callback.apply(this, arguments);
        return progressCallback(1);
      } : callback));
      return;
    }
    courseList = JSON.parse(courseList);
    progressCallback && progressCallback(1);
    return callback(courseList);
  };

  traverseCourse = function(type, successCallback, progressCallback, collectCallback, finishCallback) {
    var linkPrefix, lists, totalWorker, unChecked;
    lists = {};
    unChecked = 0;
    totalWorker = 0;
    linkPrefix = URL_CONST[type];
    parser = new DOMParser();
    if (!linkPrefix) successCallback(lists);
    processCourseList(false, function(courseList) {
      var i, _i, _ref, _results;
      courseList = filterCourse(courseList, type);
      unChecked = courseList.length;
      totalWorker = unChecked;
      if (!unChecked) successCallback(lists);
      _results = [];
      for (i = _i = 0, _ref = courseList.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        _results.push((function(i) {
          var courseId, courseName;
          courseId = courseList[i]['id'];
          courseName = courseList[i]['name'];
          return $.get(linkPrefix, {
            course_id: courseId
          }, function(data) {
            var attr, homeworkDocument, homeworkList, id, j, title, _j, _ref1;
            homeworkDocument = parser.parseFromString(data, 'text/html');
            homeworkList = homeworkDocument.querySelectorAll('#table_box .tr1, #table_box .tr2');
            for (j = _j = 0, _ref1 = homeworkList.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
              attr = homeworkList[j].querySelectorAll('td');
              if (type === 'deadline') {
                title = $(attr[0].querySelector('a')).attr('href');
                id = getURLParamters(title).id;
                lists[id] = {
                  type: 'd',
                  courseId: courseId,
                  courseName: courseName,
                  name: $.trim(attr[0].innerText),
                  start: new Date($.trim(attr[1].innerText)),
                  end: new Date($.trim(attr[2].innerText) + ' 23:59:59'),
                  submit_state: $.trim(attr[3].innerText),
                  state: 'unread',
                  id: id,
                  resultState: !(attr[5].querySelector('#lookinfo')).disabled
                };
              } else if (type === 'notification') {
                title = $(attr[1].querySelector('a')).attr('href');
                id = getURLParamters(title).id;
                lists[id] = {
                  type: 'n',
                  id: id,
                  courseId: courseId,
                  courseName: courseName,
                  name: $.trim(attr[1].innerText),
                  day: new Date($.trim(attr[3].innerText)),
                  href: $.trim($(attr[1]).find("a").attr('href')),
                  state: 'unread'
                };
              } else if (type === 'file') {
                title = $(attr[1].querySelectorAll('a')).attr('href');
                id = getURLParamters(title).file_id;
                lists[id] = {
                  type: 'f',
                  id: id,
                  courseId: courseId,
                  courseName: courseName,
                  name: $.trim(attr[1].innerText),
                  day: new Date($.trim(attr[4].innerText)),
                  href: $.trim($(attr[1]).find("a").attr('href')),
                  explanation: $.trim(attr[2].innerText),
                  state: 'unread'
                };
              }
            }
            unChecked--;
            progressCallback && progressCallback(1 - unChecked / totalWorker);
            if (unChecked === 0) {
              return db_updateList(type, lists, successCallback, collectCallback, finishCallback);
            }
          }, 'html').fail(function() {
            return errorHandler('netFail');
          });
        })(i));
      }
      return _results;
    });
  };

  prepareNormalList = function(type, list, collectCallback, finishCallback) {
    var counter, id, item, temp, value;
    temp = [];
    counter = 0;
    for (id in list) {
      value = list[id];
      item = evaluation(type, value);
      if (!(type === 'deadline') && item.state === 'unread') {
        counter += 1;
      } else if (type === 'deadline' && item.submit_state === CONST.stateTrans.unsubmit && item.dueDays >= 0) {
        counter += 1;
      }
      temp.push(item);
    }
    collectCallback && collectCallback(temp);
    list = temp.sort(function(a, b) {
      return a["eval"] - b["eval"];
    });
    db_set('cache_' + type, list, function() {
      return finishCallback();
    });
    localStorage.setItem('number_' + type, counter);
  };

  prepareCollectList = (function() {
    var backcallFunction, cList, listCount;
    listCount = 0;
    cList = [];
    backcallFunction = null;
    return function(instruction, data) {
      var counter, item, temp;
      if (instruction === 'setter') {
        return function(list) {
          cList = cList.concat(list);
          listCount += 1;
          return prepareCollectList('update');
        };
      } else if (instruction === 'backcall') {
        return backcallFunction = data;
      } else if (instruction === 'update' && listCount === CONST.featureName.length) {
        cList = cList.sort(function(a, b) {
          return a["eval"] - b["eval"];
        });
        counter = 0;
        temp = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = cList.length; _i < _len; _i++) {
            item = cList[_i];
            if (counter++ < CONST.collectNumber && item["eval"] < CONST.collectEvalLimit) {
              _results.push(item);
            }
          }
          return _results;
        })();
        db_set('cache_collect', temp, function() {
          return backcallFunction && backcallFunction();
        });
        cList = [];
        return listCount = 0;
      }
    };
  })();

  window.db_fixOldMess = db_fixOldMess;

  window.db_clearCache = db_clearCache;

  load = function(sendResponse) {
    net_login(function() {
      var bc, readyCounter, type, _i, _len, _ref, _results;
      readyCounter = 0;
      bc = function() {
        readyCounter++;
        if (readyCounter === (CONST.featureName.length + 1)) {
          sendResponse({
            op: 'ready'
          });
        }
      };
      prepareCollectList('backcall', bc);
      _ref = CONST.featureName;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        type = _ref[_i];
        _results.push(traverseCourse(type, prepareNormalList, function(p) {
          console.log(p);
        }, prepareCollectList('setter'), bc));
      }
      return _results;
    });
  };

  chrome.extension.onMessage.addListener(function(feeds, sender, sendResponse) {
    chrome.tabs.create({
      'url': feeds.url
    }, function(tab) {
      return state.tabId = tab.id;
    });
    return sendResponse();
  });

  chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    console.log(request.op);
    if (request.op === 'load') return load(sendResponse);
  });

}).call(this);
