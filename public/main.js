var Wallet = require('ethereumjs-wallet')
var util = require('ethereumjs-util')
var Buffer = require('buffer').Buffer
var queryString = require('query-string')
require('whatwg-fetch')

// @TODO: use storage.js
var id
if (localStorage.priv && localStorage.priv.length === 64) {
	id = Wallet.fromPrivateKey(Buffer.from(localStorage.priv, 'hex'))
} else {
	id = Wallet.generate()
	localStorage.priv = id.getPrivateKey().toString('hex')
}

console.log('Address: ' + id.getChecksumAddressString())

window.onload = adexLoadedCallback


function getAdData(slotId, width, height) {
	fetch('http://127.0.0.1:9710/a-d-e-x-view?slotId=' + encodeURIComponent(slotId))
		.then(function (res) {
			return res.json()
		})
		.then(function (res) {
			console.log('fetch res', res)

			let adunitIndex = Math.floor(Math.random() * res.length) //TEMP
			let adunit = res[adunitIndex]._meta
			let url = (adunit.ad_url || '').toLowerCase()

			if (!/^https?:\/\//i.test(url)) {
				url = 'http://' + url
			}

			// @TODO: this should parse the URL and include a JSONP to load the view
			// NOTE: we should tahe the width and height from the adunit but we keep it in the models as number and have to map it from adex-constants
			adexViewCallback({ imgSrc: 'http://localhost:8080/ipfs/' + encodeURIComponent(adunit.img.ipfs), width: width, height: height, url: url })
		})
		.catch(function (err) {
			console.log('fetch res', err)
		})
}

function adexLoadedCallback() {
	var query = queryString.parse(location.search)
	getAdData(query.slotId, query.width, query.height, query.slotId)
}

function adexViewCallback(data) {
	console.log('Load adunit with data', data)

	window.adeximg.src = data.imgSrc
	window.adeximg.width = data.width
	window.adeximg.height = data.height
	window.adexlink.href = data.url
	window.adexlink.onclick = adexClickCallback.bind(null, data)
	signAndSendEv({ type: 'loaded', time: Date.now(), data: data })
}

function adexClickCallback(data) {
	signAndSendEv({ type: 'clicked', time: Date.now(), data: data })
}

function signAndSendEv(ev) {
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