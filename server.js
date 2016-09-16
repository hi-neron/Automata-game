'use strict'

function io (io) {
  io.on('connection', (socket) => {
    console.log('an user connected')
    socket.on('message', (msg) => {
      socket.emit('newMessage', {message: 'a short message'})
    })
  })
}

module.exports = io

// Asegurar la conexion
