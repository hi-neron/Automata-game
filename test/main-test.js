'use strict'

const test = require('ava')
const io = require('socket.io-client')
const fixtures = require('./fixtures')
const utils = require('../lib/utils')
const config = require('../config')

require('../bin/www').test()

test.beforeEach('connect', async t => {
  // se crea una interfaz del cliente-socket, esto hace las veces del
  // front-end o del servidor principal
  let image = fixtures.getImage()
  t.context.image = image

  let token = await utils.signToken({userId: image.userId}, config.secret)

  const options = {
    transports: ['websocket'],
    'force new connection': true,
    extraHeaders: {
      Authorization: `Bearer ${token}`
    }
  }

  let client = io.connect('http://localhost:9051', options)

  t.context.client = client
})

// test.cb.skip('autentificar el socket', t => {})

test.cb.skip('getGrid', t => {
  let client = t.context.client
  client.emit('getGrid')

  client.on('grid', (data) => {
    t.end()
  })
})

test.cb.skip('Push image', t => {
  let client = t.context.client
  let image = t.context.image

  client.emit('pushImage', image)

  client.on('push', (imageGrid) => {
    // console.log(imageGrid)
    t.truthy(imageGrid.pos, 'imageGrid should have a position')
    t.is(imageGrid.rotation, 0, 'imageGrid should have a position')
    t.is(typeof imageGrid.pos, 'object', 'imageGrid should have a position')
    delete imageGrid.pos
    delete imageGrid.rotation
    t.deepEqual(imageGrid, image)
    t.end()
  })

  client.on('fail', (message) => {
    console.log(message)
    t.end()
  })

  /* score {
      badges
      skills
      points
    }
  */
  // client.on('updateScore', (score) => {
  //   console.log(score)
  //   t.is(score.points, 1, 'image should have a position')
  //   t.end()
  // })
})

test.cb('Delete image', t => {
  let client = t.context.client
  let image = t.context.image

  client.emit('pushImage', image)

  client.on('pushImage', (image) => {
    client.emit('deleteImage', image)
  })

  client.on('deletedImage', (response) => {
    console.log(response)
    t.end()
  })

  client.on('fail', (message) => {
    console.log(message)
    t.end()
  })

  /* score {
      badges
      skills
      points
    }
  */
  // client.on('updateScore', (score) => {
  //   console.log(score)
  //   t.is(score.points, 1, 'image should have a position')
  //   t.end()
  // })
})

test.cb.skip('activate skill', t => {
  let client = t.context.client
  let userId = t.context.image.userId

  let data = {
    pos: {
      x: 1,
      y: 1
    },
    skill: 'clock',
    userId: userId
  }

  client.emit('activateSkill', data)

  // se devuelve un objeto con
  /*
      {
        pos: {
          x: <- posicion X esquina superior izquierda del cuaterno de imagenes a cambiar
          y: <- posicion Y esquina superior izquierda del cuaterno de imagenes a cambiar
        },
        changes: [
          { image: image }, < imagen ◰
          { image: image }, < imagen ◳
          { image: image }, < imagen ◱
          { image: image }, < imagen ◲
        ],
        status: <200>
      }
  */

  client.on('skillChanges', (newChanges) => {
    console.log(newChanges.changes)
    t.truthy(newChanges.changes)
    t.truthy(newChanges.pos)
    t.deepEqual(newChanges.pos, data.pos)
    t.is(newChanges.changes.length, 4)
    t.end()
  })

  client.on('fail', (err) => {
    console.log(err)
    t.fail()
    t.end()
  })
})
