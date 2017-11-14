// import Web3 from 'web3'

(() => {
    let search = window.location.search
    let script = document.createElement('script')
    script.type = 'text/javascript'
    script.src= '//127.0.0.1:8080' + (search || '?slot=0' ) + '&callback=adexViewCallback'
    document.body.appendChild(script)   
})()