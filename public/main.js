var Wallet = require('ethereumjs-wallet')
var util = require('ethereumjs-util')
var Buffer = require('buffer').Buffer

// @TODO: use storage.js
var id
if (localStorage.priv && localStorage.priv.length === 64) {
	id = Wallet.fromPrivateKey(Buffer.from(localStorage.priv, 'hex'))
} else {
	id = Wallet.generate()
	localStorage.priv = id.getPrivateKey().toString('hex')
}

console.log('Address: '+id.getChecksumAddressString())

function adexViewCallback(data){
	console.log('data', data)
	window.adeximg.src = data.imgSrc
}