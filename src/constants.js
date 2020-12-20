export const NULL0x = '0x0000000000000000000000000000000000000000'

/* eslint-disable indent, object-curly-spacing */

export const NetworkName = {
  1: 'Mainnet',
  3: 'Ropsten',
  4: 'Rinkeby',
  42: 'Kovan',
  50: 'Ganache',
  77: 'Sokol',
  99: 'POA'
}

export const RougeContractType = {
  rge: 'Rouge Token'
}

export const RougeProtocolAddress = {
  1: {
    rge: '0x96Cd136F1aFB1f8934E6Cb6495Eaf24140f70325'
  },
  3: {
    rge: '0x32C3f2Ca80677Ccb67AB393d4a2429f47c94A3f3'
  },
  77: {
    rge: '0x5475300766433dd082a7340fc48a445c483df68f'
  },
  99: {
    rge: '0x2991a5445ce8f3d2a78d8a08effbf403b0f8b8ba'
  }
}

export const RougeAuthorization = {
  All: 0,
  Role: 1,
  Attachment: 2,
  Issuance: 3,
  Acquisition: 4,
  Redemption: 5,
  Kill: 6
}

export const RougeSchemeType = {
  Reserved: '0x00',
  Voucher: '0x01',
  Coupon: '0x02',
  Ticket: '0x03',
  Cashback: '0x04'
}

export const RougeSchemeVersion = {
  NonApplicable: '0x00',
  Rouge: '0x01'
}

export const RougeSchemeContext = {
  Standard: '0x00',
  Alpha: '0xaa',
  Beta: '0xbb',
  Development: '0xdd',
  Experimental: '0xee',
  Test: '0xff'
}

/* eslint-enable indent */
