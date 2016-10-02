'use strict'

let config = {
  db: process.env.NODE_BD || 'automata',
  secret: process.env.AUTOMATA_PASS || 'aut*mata' // ojo!, no usar defaults
}

module.exports = config
