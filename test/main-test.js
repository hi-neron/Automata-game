'use strict'

const test = require('ava')
const io = require('socket.io-client')
require('../bin/www').test()

const options = {
  transports: ['websocket'],
  'force new connection': true
}

test.cb.beforeEach('connect', t => {
  t.context.client = io.connect('http://localhost:9051', options)
  let client = t.context.client
  client.once('connect', () => {
    client.emit('start', 'connected')
    t.end()
  })
})

test.cb('message', t => {
  let client = t.context.client
  client.emit('message', 'hello')
  client.on('newMessage', (msg) => {
    console.log(msg)
    t.end()
  })
})
