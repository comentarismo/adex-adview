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
	// @TODO: this should parse the URL and include a JSONP to load the view
	adexViewCallback({ imgSrc: 'http://blog.strem.io/wp-content/uploads/2017/08/Download-Stremio-for-desktop-3.png', width: 300, height: 250, url: 'https://www.stremio.com' })
}

function adexViewCallback(data)
{
	console.log('Load adunit with data', data)

	window.adeximg.src = data.imgSrc
	window.adeximg.width = data.width
	window.adeximg.height = data.height
	window.adexlink.href = data.url
	window.adexlink.onclick = adexClickCallback.bind(null, data)
	signAndSendEv({ type: 'loaded', time: Date.now(), data: data })
}

function adexClickCallback(data)
{
	signAndSendEv({ type: 'clicked', time: Date.now(), data: data })
}

function signAndSendEv(ev)
{
	var blob = JSON.stringify(ev)
	var message = util.toBuffer(blob)
	var hash = util.hashPersonalMessage(message)
	var sig = util.ecsign(hash, id.getPrivateKey())

	// @TODO: send, perhaps serialize the sig

	var toSend = {
		msg: ev,
		hash: util.bufferToHex(hash),
		addr: id.getChecksumAddressString(),
		sig: { 
			mode: 1, 
			v: sig.v,
			r: util.bufferToHex(sig.r),
			s: util.bufferToHex(sig.s) 
		},
	}

	console.log(toSend)
}