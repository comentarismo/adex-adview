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

window.onload = adexLoadedCallback

function adexLoadedCallback()
{
	signAndSendEv({ type: 'loaded', time: Date.now() })
}

function adexViewCallback(data){
	console.log('load ad with data', data)
	window.adeximg.src = data.imgSrc
	window.adeximg.width = data.width
	window.adeximg.height = data.height

	signAndSendEv({ type: 'loaded', time: Date.now() })
}

function signAndSendEv(ev)
{
	var blob = JSON.stringify(ev)
	var message = util.toBuffer(blob)
	var hash = util.hashPersonalMessage(message)
	var sig = util.ecsign(hash, id.getPrivateKey())
	console.log(blob, hash, sig)
}