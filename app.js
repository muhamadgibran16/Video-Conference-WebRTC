const express = require('express')
const path = require('path')
var app = express()
const server = require('http').createServer(app)
// var server = app.listen(process.env.PORT || 3000)
const io = require('socket.io')(server, {
  allowEIO3: true,
})
var userConnections = [];

app.use(express.static(path.join(__dirname, ''))); // root directory

io.on('connection', (socket) => {
  console.log('Socket id is', socket.id);
  socket.on('userconnect', (data) => {
    console.log('userconnect', data.displayName, data.meeting_id);

    var other_users = userConnections.filter((p) => p.meeting_id == data.meeting_id)

    userConnections.push({
      connectionId: socket.id,
      user_id: data.displayName,
      meeting_id: data.meeting_id,
    })
    other_users.forEach((v) => {
      // mengirimkan informasi ke id lain
      socket.to(v.connectionId).emit('inform_others_about_me', {
        other_users_id: data.displayName,
        connId: socket.id,
      })
    })
    socket.emit('inform_me_about_other_user', other_users)
  })
  socket.on('SDPProcess', (data) => {
    socket.to(data.to_connid).emit('SDPProcess', {
      message: data.message,
      from_connid: socket.id,
    })
  })
  socket.on('disconnect', function() {
    console.log('Disconnected');
    var disUser = userConnections.find((p) => p.connectionId == socket.id);
    if (disUser) {
      var meetingid = disUser.meeting_id;
      userConnections = userConnections.filter((p) => p.connectionId != socket.id);
      var list = userConnections.filter((p) => p.meeting_id == meetingid);
      list.forEach((v) => {
        socket.to(v.connectionId).emit('inform_other_about_disconnected_user', {
          connId: socket.id,
        })
      })
    }
  })
})

// app.use('/', express.static('public'))


const port = process.env.PORT || 3000
server.listen(port, () => {
  console.log(`Express server listening on port ${port}`)
})