module.exports = {
    get: (request, response) => {
        response.setHeader("X-Frame-Options", "ALLOW-FROM *")
        response.render({})
    }
}