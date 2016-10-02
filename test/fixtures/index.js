'use strict'
const uuid = require('uuid-base62')

let fixtures = {
  getImage () {
    return {
      publicId: uuid.v4(),
      userId: `username_${uuid.uuid()}`,
      sponsors: [],
      awards: [],
      url: 'http://a/random/image.jpg',
      id: uuid.v4()
    }
  }
}

module.exports = fixtures
