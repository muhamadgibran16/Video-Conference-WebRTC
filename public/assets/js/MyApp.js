var MyApp = (function () {
  var socket = null;
  var user_id = '';
  var meeting_id = '';

  function init(uid, mid) {
    user_id = uid;
    meeting_id = mid;
    $('#meetingContainer').show();
    $('#me h2').text(user_id + '(Me)');
    document.title = user_id;
    event_process_for_signaling_server();
    eventHandeling();
  }

  function event_process_for_signaling_server() {
    socket = io.connect();

    var SDP_function = function (data, to_connid) {
      // untuk mendapatkan informasi data ke pengguna
      socket.emit('SDPProcess', {
        message: data,
        to_connid: to_connid,
      });
    };
    socket.on('connect', () => {
      // alert('Socket connected to client side')
      if (socket.connected) {
        AppProcess.init(SDP_function, socket.id);
        if (user_id != '' && meeting_id != '') {
          socket.emit('userconnect', {
            displayName: user_id,
            meeting_id: meeting_id
          });
        }
      }
    });
    socket.on('inform_other_about_disconnected_user', function (data) {
      $('#' + data.connId).remove();
      $('.participant-count').text(data.uNumber);
      $('#participant_' + data.connId + '').remove();
      AppProcess.closeConnectionCall(data.connId);
    });
    socket.on('inform_others_about_me', function (data) {
      addUser(data.other_user_id, data.connId, data.userNumber);
      AppProcess.setNewConnection(data.connId);
    });

    // socket.on('inform_me_about_other_user', function (other_users) {
    //   if (other_users) {
    //     for (var i = 0; i < other_users.length; i++) {
    //       addUser(other_users[i].user_id, other_users[i].connectionId);
    //       AppProcess.setNewConnection(other_users[i].connectionId);
    //     }
    //   }
    // });
    socket.on('inform_me_about_other_user', function (other_users) {
      var userNumber = other_users.length;
      var userNumb = userNumber + 1;
      if (other_users) {
        for (var i = 0; i < other_users.length; i++) {
          // Periksa apakah pengguna sudah ada di layar
          var existingUser = document.getElementById(other_users[i].connectionId);
          if (!existingUser) {
            addUser(other_users[i].user_id, other_users[i].connectionId, userNumb);
            AppProcess.setNewConnection(other_users[i].connectionId);
          }
        }
      }
    });

    // socket.on('inform_others_about_me', function (data) {
    //   addUser(data.other_user_id, data.connId)
    //   AppProcess.setNewConnection(data.connId)
    // })
    // socket.on('inform_me_about_other_user', function (other_users) {
    //   if (other_users) {
    //     for (var i = 0; i < other_users.length; i++) {
    //       addUser(other_users[i].user_id, other_users[i].connectionId);
    //       AppProcess.setNewConnection(other_users[i].connectionId);
    //     }
    //   }
    // })
    socket.on('SDPProcess', async function (data) {
      await AppProcess.processClientFunc(data.message, data.from_connid);
    });
    socket.on('showChatMessage', function (data) {
      var time = new Date();
      var lTime = time.toLocaleString('en-US', {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      var div = $('<div>').html('<span class="fw-bold me-3" style="color: #000;">' + data.from + '</span>' + lTime + '<br>' + data.message);
      $('#messages').append(div);
    });
  }

  function eventHandeling() {
    $('#btnsend').on('click', function () {
      var msgData = $('#msgbox').val();
      socket.emit('sendMessage', msgData);
      var time = new Date();
      var lTime = time.toLocaleString('en-US', {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      var div = $('<div>').html('<span class="fw-bold me-3" style="color: #000;">' + user_id + '</span>' + lTime + '<br>' + msgData);
      $('#messages').append(div);
      $('#msgbox').val('');
    });
    var url = window.location.href;
    $('.meeting_url').text(url);
  }

  function addUser(other_user_id, connId, userNum) {
    var newDivId = $('#otherTemplate').clone();
    newDivId = newDivId.attr('id', connId).addClass('other');
    newDivId.find('h2').text(other_user_id);
    newDivId.find('video').attr('id', 'v_' + connId);
    newDivId.find('audio').attr('id', 'a_' + connId);
    newDivId.show();

    $('#divUsers').append(newDivId);
    $('.in-call-wrap-up').append('<div class="in-call-wrap d-flex justify-content-between align-items-center mb-3" id="participant_' + connId + '"> <div class="participant-img-name-wrap display-center cursor-pointer"> <div class="participant-img"> <img src="public/assets/img/pngwing.com (12).png" class="border border-secondary" alt="" style="width: 40px; height: 40px; border-radius: 50%;"> </div> <div class="participant-img ms-2">' + other_user_id + '</div> </div> <div class="participant-action-wrap display-center"> <div class="participant-action-wrap-pin display-center me-2 cursor-pointer"> <i class="bi bi-pin"></i> </div> <div class="participant-action-wrap-dot display-center me-2 cursor-pointer"> <i class="bi bi-three-dots-vertical"></i> </div> </div> </div>');

    $(".participant-count").text(userNum);
  }

  $(document).on('click', '.people-heading', function () {
    $('.in-call-wrap-up').show(300);
    $('.chat-show-wrap').hide(300);
    $(this).addClass('active');
    $('.chat-heading').removeClass('active');
  });
  $(document).on('click', '.chat-heading', function () {
    $('.in-call-wrap-up').hide(300);
    $('.chat-show-wrap').show(300);
    $(this).addClass('active');
    $('.people-heading').removeClass('active');
  });
  $(document).on('click', '.meeting-heading-cross', function () {
    $('.g-right-details-wrap').hide(300);
  });
  $(document).on('click', '.top-left-participant-wrap', function () {
    $('.g-right-details-wrap').show(300);
    $('.in-call-wrap-up').show(300);
    $('.chat-show-wrap').hide(300);
  });
  $(document).on('click', '.top-left-chat-wrap', function () {
    $('.g-right-details-wrap').show(300);
    $('.in-call-wrap-up').hide(300);
    $('.chat-show-wrap').show(300);
  });
  $(document).on('click', '.end-call-wrap', function () {
    $('.top-box-show').css({
      "display": "block",
    }).html(' <div class="top-box align-vertical-middle profile-dialog-show text-center mt-3"> <h1 class="mt-2">Leave Meeting</h1> <div class="call-leave-cancel-action d-flex justify-content-center align-items-center w-100"> <a href="/action.html"><button class="call-leave-action btn btn-danger me-5">Leave</button></a> <button class="call-cancel-action btn btn-secondary">Cancel</button> </div> </div>');
  });
  $(document).on('click', '.end-call-wrap', function () {
    $('.top-box-show').css({
      "display": "block",
    }).html(' <div class="top-box align-vertical-middle profile-dialog-show text-center mt-3"> <h1 class="mt-2">Leave Meeting</h1> <div class="call-leave-cancel-action d-flex justify-content-center align-items-center w-100"> <a href="/action.html"><button class="call-leave-action btn btn-danger me-5">Leave</button></a> <button class="call-cancel-action btn btn-secondary">Cancel</button> </div> </div>');
  });
  $(document).mouseup(function (e) {
    var container = new Array();
    container.push($('.top-box-show'));
    $.each(container, function (key, value) {
      if (!$(value).is(e.target) && $(value).has(e.target).length == 0) {
        $(value).empty();
      }
    });
  });
  $(document).on('click', '.call-cancel-action', function () {
    $('.top-box-show').html('');
  });

  $(document).on('click', '.copy_info', function () {
    var $temp = $('<input>');
    $('body').append('$temp');
    $temp.val($('.meeting_url').text()).select();
    document.execCommand('copy');
  });

  return {
    _init: function (uid, mid) {
      init(uid, mid);
    }
  };
})();