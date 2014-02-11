/*
* This JavaScript file implements everything authentication
* related in the 123done demo. This includes interacting
* with the Persona API, the 123done server, and updating
* the UI to reflect sign-in state.
*/

$(document).ready(function() {
  window.loggedInEmail = null;

  var loginAssertion = null;

  // verify the assertion on the server, which will use the
  // verification service provided by mozilla
  // see the '/verify' handler inside server.js for details
  function verifyAssertion(assertion, success, failure)
  {
    $.post('/api/verify', {
      assertion: assertion
    }, function(data, status, xhr) {
      try {
        if (status !== 'success') throw data;
        if (data.status !== 'okay') throw data.reason;
        success(data);
      } catch(e) {
        failure(e ? e.toString() : e);
      }
    });
  }

  // now check with the server to get our current login state
  $.get('/api/auth_status', function(data) {
    loggedInEmail = JSON.parse(data).logged_in_email;

    function updateUI(email) {
      $("ul.loginarea li").css('display', 'none');
      if (email) {
        $('#loggedin span').text(email);
        $('#loggedin').css('display', 'block');
      } else {
        $('#loggedin span').text('');
        $('#loggedout').css('display', 'block');
      }
      $("button").removeAttr('disabled').css('opacity', '1');
    }

    function updateListArea(email) {
      $("section.todo ul").css('display', 'none');
      $("section.todo form").css('display', 'none');
      if (email) {
        $('#addform').css('display', 'block');
        $('#todolist').css('display', 'block');
      } else {
        $('#signinhere').css('display', 'block');
      }
    }

    // register callbacks with the persona API to be invoked when
    // the user logs in or out.
    navigator.id.ready(function (email) {
      login(email);
    });

    ready(loggedInEmail);

    function login(email) {
      loggedInEmail = email;
      updateUI(loggedInEmail);
      updateListArea(loggedInEmail);

      State.merge();
    }

    function ready(email) {
      // Only update the UI if no assertion is being verified
      loggedInEmail = email;

      updateUI(loggedInEmail);
      updateListArea(loggedInEmail);

      // display current saved state
      State.load();
    }

    function logout() {
      loggedInEmail = null;
      updateUI(loggedInEmail);
      updateListArea(loggedInEmail);

      // clear items from the dom at logout
      $("#todolist > li").remove();
      State.save();

      // don't display the warning icon at logout time, but wait until the user
      // makes a change to her tasks
      $("#dataState > div").css('display', 'none');

      document.location.search = '';

      // upon logout, make an api request to tear the user's session down
      $.post('/api/logout');
    }

    $('button').click(function(ev) {
      ev.preventDefault();

      // disable the sign-in button when a user clicks it, it will be
      // re-enabled when the assertion passed into onlogin is verified,
      // or if the user cancels the dialog.
      $("button").attr('disabled', 'disabled').css('opacity', '0.5');
      navigator.id.signin();
    });

    // upon click of logout link navigator.id.logout()
    $("#loggedin a").click(function(ev) {
      ev.preventDefault();

      logout();
    });
  });
});
