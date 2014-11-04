/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function () {
  'use strict';

  var FXA_HOST = 'http://127.0.0.1:3030';

  function bind(func, context) {
    return function() {
      var args = [].slice.call(arguments, 0);
      func.apply(context, args);
    };
  }

  function createElement(type, attributes) {
    var el = document.createElement(type);

    for (var attribute in attributes) {
      el.setAttribute(attribute, attributes[attribute]);
    }

    return el;
  }

  function cssPropsToString(props) {
    var str = '';

    for (var key in props) {
      str += key + ':' + props[key] + ';';
    }

    return str;
  }

  function getIframeSrc(options) {
    if (options.redirectTo) {
      return options.redirectTo;
    }
    return FXA_HOST + '/' + options.page;
  }

  function parseFxAEvent(msg) {
    var components = msg.split('!!!');
    return {
      command: components[0],
      data: JSON.parse(components[1] || '{}')
    };
  }

  function stringifyFxAEvent(command, data) {
    return command + '!!!' + JSON.stringify(data || '');
  }



  function FirefoxAccounts(options) {
    this._done = options.done;
    this._boundOnMessage = bind(this.onMessage, this);
    window.addEventListener('message', this._boundOnMessage, false);

    this.showFxA(options);
  }

  FirefoxAccounts.prototype = {
    showFxA: function (options) {
      var background = this._backgroundEl = createElement('div', {
        style: cssPropsToString({
          background: 'rgba(0,0,0,0.5)',
          bottom: 0,
          left: 0,
          position: 'fixed',
          right: 0,
          top: 0
        })
      });


      var iframe = createElement('iframe', {
        src: getIframeSrc(options),
        width: '600',
        height: '400',
        allowtransparency: 'true',
        border: '0',
        style: cssPropsToString({
          background: 'transparent',
          border: 'none',
          display: 'block',
          height: '600px',
          margin: '0 auto 0 auto',
          position: 'relative',
          top: '10%',
          width: '400px'
        })
      });

      background.appendChild(iframe);
      document.body.appendChild(background);

      // The window where messages go
      this._contentWindow = iframe.contentWindow;
    },

    unload: function () {
      if (this._backgroundEl) {
        document.body.removeChild(this._backgroundEl);
      }

      window.removeEventListener('message', this._boundOnMessage, false);
    },

    onMessage: function (event) {
      if (event.origin !== FXA_HOST) {
        return;
      }

      var parsed = parseFxAEvent(event.data);
      var command = parsed.command;
      var data = parsed.data;

      var handler = this.commands[command] || this.commands.ignore;
      handler.call(this, command, data);
    },

    // commands that come from the iframe. They are called
    // in the FirefoxAccounts object context.
    commands: {
      cancel: function (command, data) {
        this.unload();
        this._done({ reason: 'cancel' });
      },
      error: function (command, data) {
        this.unload();
        this._done(data);
      },
      /*jshint camelcase:false*/
      ping: function (command, data) {
        // ping is used to get the RP's origin. If the RP's origin is not
        // whitelisted, it cannot be iframed.
        var msg = stringifyFxAEvent(command, data);

        this._contentWindow.postMessage(msg, FXA_HOST);
      },
      ignore: function (command, data) {
        console.log('ignoring command: %s', command);
      },
      oauth_cancel: function (command, data) {
        this.unload();
      },
      oauth_complete: function (command, data) {
        this.unload();
        this._done(null, {
          command: command,
          data: data
        });
      }
    }
  };

  navigator.mozAccounts = {
    get: function (options) {
      options = options || {};

      if (! options.done) {
        throw new Error('done must be specified');
      }

      if (typeof options.done !== 'function') {
        throw new Error('done must be a function');
      }

      new FirefoxAccounts(options);
    }
  };
}());
