'use strict'
const jwt = require('jsonwebtoken')
const bearer = require('token-extractor')
// const co = require('co')

function extractToken (req) {
  return new Promise((resolve, reject) => {
    bearer(req, (err, token) => {
      if (err) return reject(err)
      resolve(token)
    })
  })
}

function verifyToken (token, secret, options) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, options, (err, decoded) => {
      if (err) return reject(err)
      resolve(decoded)
    })
  })
}

function signToken (payload, secret, options) {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, secret, options, (err, token) => {
      if (err) return reject(err)
      resolve(token)
    })
  })
}

module.exports = {
  extractToken,
  verifyToken,
  signToken
}
