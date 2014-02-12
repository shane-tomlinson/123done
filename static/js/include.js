/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function() {
  if (! navigator.id) {
    navigator.id = {};
  }

  navigator.id.signup = function () {
    document.location.href = "http://localhost:3030/signup?service=123done&redirectTo=" + document.location.href;
  };

  navigator.id.signin = function () {
    document.location.href = "http://localhost:3030/signin?service=123done&redirectTo=" + document.location.href;
  };

  navigator.id.ready = function (ready) {
    var email = searchParam('email');
    if (email) {
      ready(email);
    }
  };

  function searchParam(name, str) {
    var search = (str || window.location.search).replace(/^\?/, '');
    if (! search) {
      return;
    }

    var pairs = search.split('&');
    var terms = {};

    pairs.forEach(function (pair) {
      var keyValue = pair.split('=');
      terms[keyValue[0]] = decodeURIComponent(keyValue[1]);
    });

    return terms[name];
  }
}());

