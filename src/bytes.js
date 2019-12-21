
export function isHexable (value) {
  return !!(value.toHexString)
}

export function addSlice (array) {
  if (array.slice) {
    return array
  }
  array.slice = function () {
    var args = Array.prototype.slice.call(arguments)
    return addSlice(new Uint8Array(Array.prototype.slice.apply(array, args)))
  }
  return array
}

export function isArrayish (value) {
  // eslint-disable-next-line eqeqeq
  if (!value || parseInt(String(value.length)) != value.length || typeof (value) === 'string') {
    return false
  }
  for (var i = 0; i < value.length; i++) {
    var v = value[i]
    // eslint-disable-next-line eqeqeq
    if (v < 0 || v >= 256 || parseInt(String(v)) != v) {
      return false
    }
  }
  return true
}

export function arrayify (value) {
  if (value == null) {
    throw new Error('cannot convert null value to array')
  }
  if (isHexable(value)) {
    value = value.toHexString()
  }
  if (typeof (value) === 'string') {
    var match = value.match(/^(0x)?[0-9a-fA-F]*$/)
    if (!match) {
      throw new Error('invalid hexidecimal string')
    }
    if (match[1] !== '0x') {
      throw new Error('hex string must have 0x prefix')
    }
    value = value.substring(2)
    if (value.length % 2) {
      value = '0' + value
    }
    var result = []
    for (var i = 0; i < value.length; i += 2) {
      result.push(parseInt(value.substr(i, 2), 16))
    }
    return addSlice(new Uint8Array(result))
  }
  if (isArrayish(value)) {
    return addSlice(new Uint8Array(value))
  }
  throw new Error('invalid arrayify value')
}

export function concat (objects) {
  var arrays = []
  var length = 0
  for (var i = 0; i < objects.length; i++) {
    var object = arrayify(objects[i])
    arrays.push(object)
    length += object.length
  }
  var result = new Uint8Array(length)
  var offset = 0
  for (i = 0; i < arrays.length; i++) {
    result.set(arrays[i], offset)
    offset += arrays[i].length
  }
  return addSlice(result)
}

export function stripZeros (value) {
  var result = arrayify(value)
  if (result.length === 0) {
    return result
  }
  // Find the first non-zero entry
  var start = 0
  while (result[start] === 0) {
    start++
  }
  // If we started with zeros, strip them
  if (start) {
    result = result.slice(start)
  }
  return result
}

export function padZeros (value, length) {
  value = arrayify(value)
  if (length < value.length) {
    throw new Error('cannot pad')
  }
  var result = new Uint8Array(length)
  result.set(value, length - value.length)
  return addSlice(result)
}

export function isHexString (value, length) {
  if (typeof (value) !== 'string' || !value.match(/^0x[0-9A-Fa-f]*$/)) {
    return false
  }
  if (length && value.length !== 2 + 2 * length) {
    return false
  }
  return true
}

var HexCharacters = '0123456789abcdef'
export function hexlify (value) {
  if (isHexable(value)) {
    return value.toHexString()
  }
  if (typeof (value) === 'number') {
    if (value < 0) {
      throw new Error('cannot hexlify negative value')
    }
    // @TODO: Roll this into the above error as a numeric fault (overflow); next version, not backward compatible
    // We can about (value == MAX_INT) to as well, since that may indicate we underflowed already
    if (value >= 9007199254740991) {
      throw new Error('out-of-range')
    }
    var hex = ''
    while (value) {
      hex = HexCharacters[value & 0x0f] + hex
      value = Math.floor(value / 16)
    }
    if (hex.length) {
      if (hex.length % 2) {
        hex = '0' + hex
      }
      return '0x' + hex
    }
    return '0x00'
  }
  if (typeof (value) === 'string') {
    var match = value.match(/^(0x)?[0-9a-fA-F]*$/)
    if (!match) {
      throw new Error('invalid hexidecimal string')
    }
    if (match[1] !== '0x') {
      throw new Error('hex string must have 0x prefix')
    }
    if (value.length % 2) {
      value = '0x0' + value.substring(2)
    }
    return value
  }
  if (isArrayish(value)) {
    var result = []
    for (var i = 0; i < value.length; i++) {
      var v = value[i]
      result.push(HexCharacters[(v & 0xf0) >> 4] + HexCharacters[v & 0x0f])
    }
    return '0x' + result.join('')
  }
  throw new Error('invalid hexlify value')
}

export function hexDataLength (data) {
  if (!isHexString(data) || (data.length % 2) !== 0) {
    return null
  }
  return (data.length - 2) / 2
}

export function hexDataSlice (data, offset, endOffset) {
  if (!isHexString(data)) {
    throw new Error('invalid hex data')
  }
  if ((data.length % 2) !== 0) {
    throw new Error('hex data length must be even')
  }
  offset = 2 + 2 * offset
  if (endOffset != null) {
    return '0x' + data.substring(offset, 2 + 2 * endOffset)
  }
  return '0x' + data.substring(offset)
}

export function hexStripZeros (value) {
  if (!isHexString(value)) {
    throw new Error('invalid hex string')
  }
  while (value.length > 3 && value.substring(0, 3) === '0x0') {
    value = '0x' + value.substring(3)
  }
  return value
}

export function hexZeroPad (value, length) {
  if (!isHexString(value)) {
    throw new Error('invalid hex string')
  }
  while (value.length < 2 * length + 2) {
    value = '0x0' + value.substring(2)
  }
  return value
}

export function isSignature (value) {
  return (value && value.r != null && value.s != null)
}

export function splitSignature (signature) {
  var v = 0
  var r = '0x'; var s = '0x'
  if (isSignature(signature)) {
    if (signature.v == null && signature.recoveryParam == null) {
      throw new Error('at least on of recoveryParam or v must be specified')
    }
    r = hexZeroPad(signature.r, 32)
    s = hexZeroPad(signature.s, 32)
    v = signature.v
    if (typeof (v) === 'string') {
      v = parseInt(v, 16)
    }
    var recoveryParam = signature.recoveryParam
    if (recoveryParam == null && signature.v != null) {
      recoveryParam = 1 - (v % 2)
    }
    v = 27 + recoveryParam
  } else {
    var bytes = arrayify(signature)
    if (bytes.length !== 65) {
      throw new Error('invalid signature')
    }
    r = hexlify(bytes.slice(0, 32))
    s = hexlify(bytes.slice(32, 64))
    v = bytes[64]
    if (v !== 27 && v !== 28) {
      v = 27 + (v % 2)
    }
  }
  return {
    r: r,
    s: s,
    recoveryParam: (v - 27),
    v: v
  }
}

export function joinSignature (signature) {
  signature = splitSignature(signature)
  return hexlify(concat([
    signature.r,
    signature.s,
    (signature.recoveryParam ? '0x1c' : '0x1b')
  ]))
}
