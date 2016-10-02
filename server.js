'use strict'

const Grid = require('automata-grid')
const Score = require('automata-score')
const config = require('./config')
const utils = require('./lib/utils')
const co = require('co')

const settings = {
  db: config.db
}

const grid = new Grid(settings)
const score = new Score(settings)

function io (io) {
  // inicia el servidor RT
  io.on('connection', (socket) => {
    // extrae el token desde el socket
    Promise.resolve(utils.extractToken(socket.handshake)).then((token) => {
      socket.token = token
    }, (error) => {
      console.log(error)
      socket.token = null
    })

    // Estos eventos se ejecuntan CON seguridad 🔒
    // ------------------------------------------>

    // nueva imagen, lo emite el servidor principal 9090
    // y recibe la imagen:

    socket.on('start', () => {
      console.log('hi')
      if (socket.token) {
        socket.emit('welcome', {status: 200, message: 'welcome Automata'})
      } else {
        socket.emit('welcome', {status: 200, message: 'welcome user'})
      }
    })

    socket.on('pushImage', (image) => {
      /*
        { id: <id generado por rethinkdb>,
          publicId: <generado por automata-db>,
          userId: <publicId del usuario>,
          src: <direccion en aws S3>,
          description: <texto con descripcion breve>,
          awards: <awards validos son 3>,
          createdAt: <fecha de creacion>,
      // ❗️ Desde pushImage:
          rotation: <generado por push>,
          pos: <generado por pushImage> < ❗️ OJO - DEBUGGING
        }
    */
      // console.log(socket.token)

      // Promise.resolve(grid.pushImage(image)).then((imageInGrid) => {
      //   io.sockets.emit('change', imageInGrid)
      // })

      console.log(`pushing ${image.publicId}`)

      let tasks = co.wrap(function * () {
        let decoded

        try {
          decoded = yield utils.verifyToken(socket.token, config.secret)
        } catch (e) {
          console.log(e)
          socket.emit('fail', {error: 400, message: 'Invalid token'})
          return Promise.reject(e)
        }

        console.log(decoded)
        console.log(image.from)

        if (decoded.server === image.from) {
          let imageInGrid

          try {
            imageInGrid = yield grid.pushImage(image)
          } catch (e) {
            socket.emit('fail', {status: 400, error: e.message})
            return Promise.reject(e)
          }

          io.sockets.emit('pushImage', imageInGrid)
        } else {
          socket.emit('fail', {error: 400, message: 'Invalid header'})
        }

        return Promise.resolve({ok: 'ok'})
      })

      Promise.resolve(tasks())
    })

    socket.on('deleteImage', (image) => {
      /*
        { from: <main-server>,
          publicId: <generado por automata-db>,
          pos: <generado por pushImage> < ❗️ OJO - DEBUGGING
        }
    */
      // console.log(socket.token)

      // Promise.resolve(grid.pushImage(image)).then((imageInGrid) => {
      //   io.sockets.emit('change', imageInGrid)
      // })

      console.log(`deleting ${image.publicId}`)

      let tasks = co.wrap(function * () {
        let decoded

        try {
          decoded = yield utils.verifyToken(socket.token, config.secret)
        } catch (e) {
          socket.emit('fail', {error: 400, message: 'Invalid token'})
          return Promise.reject(e)
        }

        if (decoded.server === image.from) {
          let response

          try {
            response = yield grid.removeImage(image)
          } catch (e) {
            socket.emit('fail', {status: 400, error: e.message})
            return Promise.reject(e)
          }

          io.sockets.emit('deletedImage', response)
        } else {
          socket.emit('fail', {error: 400, message: 'Invalid header'})
        }

        return Promise.resolve({ok: 'ok'})
      })

      Promise.resolve(tasks())
    })

    // Activa una skill, necesita token de seguridad
    socket.on('activateSkill', (data) => {
       /* data: {
          pos: {x:, y:},
          skill: <skillname>,
          from: <seguridad>,
          userId: <para implementar el modulo score>
        }
       */
      let tasks = co.wrap(function * () {
        let decoded
        let error = {error: 400, message: 'Invalid token'}

        try {
          decoded = yield utils.verifyToken(socket.token, config.secret)
        } catch (e) {
          socket.emit('fail', error)
          return Promise.reject(e)
        }

        if (decoded.server === data.from) {
          let changes

          try {
            changes = yield grid.onSkill(data)
          } catch (e) {
            socket.emit('fail', {status: 400, error: 'Invalid data'})
            return Promise.reject(e)
          }

          io.sockets.emit('skillChanges', changes)
        } else {
          socket.emit('fail', error)
          return Promise.reject(error)
        }

        return Promise.resolve({ok: 'ok'})
      })
      Promise.resolve(tasks())
    })

    // Estos eventos se ejecuntan SIN seguridad 🔓
    // ------------------------------------------>

    // devuelve la grilla entera, no necesita token de seguridad
    socket.on('getGrid', () => {
      Promise.resolve(grid.getGrid()).then((grid) => {
        socket.emit('grid', grid)
      })
    })

    // en caso de crear una nueva grilla emite la grilla creada
    // en caso de un cambio, emite el nuevo cambio
  })
}

module.exports = io

// Asegurar la conexion
