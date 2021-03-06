require('whatwg-fetch')
var Wallet = require('ethereumjs-wallet')
var util = require('ethereumjs-util')
var Buffer = require('buffer').Buffer
var queryString = require('query-string')
var NODE_BASE_URL = 'https://node.adex.network'
var TEMP_DEFAULT_IMG_IPFS = 'QmeQqaZC1ftKp1uWbpVRVhbCwBBrysTa3DBg9JUr6NWrQx'
var TEMP_DEFAULT_LINK = 'https://adex.network/'
var IPFS_GATEWAY = 'https://ipfs.adex.network/ipfs/' 

// @TODO: use storage.js
var id
var userid
var authSig
var currentBidId //contract id 
var curretAdUnit //ipfs
var authErr = false
var query = queryString.parse(location.search)

setImgPlaceholderSize()

if (localStorage.priv && localStorage.priv.length === 64) {
	id = Wallet.fromPrivateKey(Buffer.from(localStorage.priv, 'hex'))
} else {
	id = Wallet.generate()
	localStorage.priv = id.getPrivateKey().toString('hex')
}

userid = id.getChecksumAddressString()

// console.log('Address: ' + userid)

auth()

function setAuth(err, data) {
	if (err || !data.signature || !data.expiryTime) {
		authErr = true
	}
	else {
		authSig = data.signature
		localStorage.setItem('userid-' + userid, data.signature + '-' + data.expiryTime)
	}

	init()
}

function auth() {
	let sigAndTIme = localStorage.getItem('userid-' + userid)

	if (!sigAndTIme) {
		getAuthSig(setAuth)
		return
	}

	sigAndTIme = sigAndTIme.split('-')
	let sig = sigAndTIme[0]
	let time = sigAndTIme[1]

	if (!time || (parseInt(time, 10) <= Date.now())) {
		getAuthSig(setAuth)
	} else {
		authSig = sig
		checkAuth()
	}
}

function checkAuth(sig) {
	fetch(NODE_BASE_URL + '/auth-check', {
		method: 'GET',
		headers: getHeaders(),
	})
		.then((res) => {
			return res.json()
		})
		.then((res) => {
			if (res && res.authenticated) {
				init()
			} else {
				getAuthSig(setAuth)
			}
		})
		.catch((err) => {
			// console.log('checkAuth err', err)
			getAuthSig(setAuth)
		})
}

function init() {
	if (document.readyState === "complete") {
		adexLoadedCallback()
	} else {
		window.onload = adexLoadedCallback
	}
}

//TODO: set it to localStorage
function getAuthSig(cb) {
	var authToken = (Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)).toString()
	var sigAndHash = signMsg(authToken)

	var toSend = {
		userid: userid,
		signature: sigAndHash.sig.rpcSig,
		mode: 1,
		authToken: authToken
	}

	fetch(NODE_BASE_URL + '/auth', {
		method: 'POST',
		headers: getHeaders(),
		body: JSON.stringify(toSend)
	})
		.then((res) => {
			return res.json()
		})
		.then((res) => {
			cb(null, res)
		})
		.catch((err) => {
			// console.log('gethAuth err', err)
			cb(err, null)
		})
}

function getAdData(slotIpfs, width, height, fallbackUrl, fallbackImgIpfs) {
	fetch(NODE_BASE_URL + '/view?slotIpfs=' + encodeURIComponent(slotIpfs),
		{ headers: getHeaders() })
		.then(function (res) {
			if (res.status >= 200 && res.status < 400) {
				return res.json()
			} else {
				throw 'Error getting slot data'
			}
		})
		.then(function (res) {
			// console.log('fetch res', res)

			let bidIndex = Math.floor(Math.random() * res.length) //TEMP
			let bid = res[bidIndex].bid
			let adunitRes = res[bidIndex].adUnit
			let adunit = adunitRes._meta
			let url = (adunit.ad_url || '').toLowerCase()

			currentBidId = bid._id
			curretAdUnit = adunitRes._ipfs

			// @TODO: this should parse the URL and include a JSONP to load the view
			// NOTE: we should tahe the width and height from the adunit but we keep it in the models as number and have to map it from adex-constants
			adexViewCallback({ imgSrc: getImgIpfsUrl(adunit.img.ipfs), width: width, height: height, url: getHttpUrl(url) })
		})
		.catch(function (err) {
			adexViewCallback({ imgSrc: getImgIpfsUrl(fallbackImgIpfs), width: width, height: height, url: getHttpUrl(fallbackUrl) })
		})
}

function adexLoadedCallback() {
	var isValidFallbackIPFS = /^(Qm[a-zA-Z\d]{44})$/.test(query.fallbackImgIpfs)
	var queryFallbackImgIpfs = isValidFallbackIPFS ? query.fallbackImgIpfs : ''
	var fallbackImgIpfs = queryFallbackImgIpfs || TEMP_DEFAULT_IMG_IPFS

	var fallbackUrl = query.fallbackUrl || TEMP_DEFAULT_LINK

	if (authErr) {
		adexViewCallback({ imgSrc: getImgIpfsUrl(fallbackImgIpfs), width: query.width, height: query.height, url: getHttpUrl(fallbackUrl) })
	} else {
		getAdData(query.slotIpfs, query.width, query.height, fallbackUrl, fallbackImgIpfs)
	}
}

function adexViewCallback(data) {
	var adexImg = document.createElement("div")

	adexImg.src = data.imgSrc
	adexImg.style.width = data.width + 'px'
	adexImg.style.height = data.height + 'px'
	adexImg.style.backgroundImage = 'url("' + data.imgSrc + '")'
	adexImg.style.boredr = '0'
	adexImg.style.backgroundPosition = 'center'
	adexImg.style.backgroundSize = 'cover'
	adexImg.style.backgroundRepeat = 'no-repeat'
	adexImg.style.boredr = '0'

	window.adexlink.href = data.url
	window.adexlink.target = '_blank'
	window.adexlink.onclick = adexClickCallback.bind(null, data)

	window.adeximgplaceholder.style = 'display: none;'
	window.adexlink.appendChild(adexImg)

	signAndSendEv({ type: 'loaded', time: Date.now() })
}

function adexClickCallback(data) {
	signAndSendEv({ type: 'click', time: Date.now() })
}

function signMsg(msg) {
	var message = util.toBuffer(msg)
	var hash = util.hashPersonalMessage(message)
	var sig = util.ecsign(hash, id.getPrivateKey())
	return {
		hash: util.bufferToHex(hash),
		sig: {
			mode: 1,
			v: sig.v,
			r: util.bufferToHex(sig.r),
			s: util.bufferToHex(sig.s),
			rpcSig: util.toRpcSig(sig.v, sig.r, sig.s)
		}
	}
}

// JSON.stringify({ 'type': payload.type, 'adunit': payload.adunit, 'address':  payload.address, ' signature' : payload.signature})]
function signAndSendEv(ev) {
	if (!currentBidId) {
		return // TODO: in no bid do not set events 
	}

	ev.adunit = curretAdUnit
	ev.bid = currentBidId
	ev.address = userid

	var blob = JSON.stringify(ev)
	var sigAndHash = signMsg(blob)

	var toSend = {
		//signed props
		type: ev.type,
		time: ev.time,
		adunit: curretAdUnit,
		bid: currentBidId,
		address: userid,

		//not signed props
		sigMode: 1,
		signature: sigAndHash.sig.rpcSig
	}

	fetch(NODE_BASE_URL + '/submit', {
		method: 'POST',
		headers: getHeaders(),
		body: JSON.stringify(toSend)
	})
		.then((res) => {
			return res.text()
		})
		.then((res) => {
			// console.log('signAndSendEv res', res)
		})
		.catch((err) => {
			// console.log('signAndSendEv err', err)
		})
}

function getHeaders(otherHeaders) {
	otherHeaders = otherHeaders || []
	var hdrs = {
		'X-User-Address': userid || '',
		'X-User-Signature': authSig || '',
		// 'X-Auth-Token': authToken,
		'Content-Type': 'application/json'
	}

	for (let index = 0; index < otherHeaders.length; index++) {
		var hdr = otherHeaders[index]
		hdrs[hdr.key] = hdr.value
	}

	return hdrs
}

function getHttpUrl(url) {
	if (!/^https?:\/\//i.test(url)) {
		url = '//' + url
	}

	return url
}

function getImgIpfsUrl(ipfs) {
	return IPFS_GATEWAY + encodeURIComponent(ipfs)
}

function setImgPlaceholderSize() {
	window.adeximgplaceholder.width = query.width
	window.adeximgplaceholder.height = query.height
}