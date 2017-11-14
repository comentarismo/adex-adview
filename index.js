global.app = require('aero')()

app.use((request, response, next) => {
	response.setHeader("X-Frame-Options", "ALLOW-FROM *")
	next()
})

app.run()
