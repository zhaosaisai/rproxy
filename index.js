const http = require('http')
const util = require('util')

module.exports = reverseProxy

function log(...infos) {
    const time = new Date().toLocaleString()
    console.log(time, util.format(...infos))
}

function errorHandler(req, res, uid) {
    return function(err) {
        const message = String(err.stack || err.message || err)
        log('[%s] 出现了错误 [%s]', uid, message)
        if(!res.headersSent) {
            res.writeHead(500, {
                "content-type": "text/plain"
            })
        }
        res.end(message)
    }
}

function getServer(servers = []) {
    const server = servers.shift()
    servers.push(server)
    return server
}

function reverseProxy(options = {}) {
    let { servers } = options
    
    if(!Array.isArray(servers) || !servers.length) {
        throw new Error(`参数${servers}必须是数组且不能为空！`)
    }

    // 转化servers -> [ { host: ..., port: ...} ]
    servers = servers.map(server => {
        const hostPorts = server.split(":")
        return {
            hostname: hostPorts[0],
            port: hostPorts[1] || 80
        }
    })

    return function(req, res) {
        const { url, headers, method } = req
        const { hostname, port } = getServer(servers)
        const preOptions = {
            hostname,
            port,
            path: url,
            headers,
            method
        }

        const uid = `${method} ${url} => ${hostname}:${port}`
        log("[%s] 接收到代理请求", uid)

        const proxyRequest = http.request(preOptions, proxyRes => {
            proxyRes.on("error", errorHandler(req, res, uid))
            log("[%s] 收到响应 [%s]", uid, proxyRes.statusCode)
            res.writeHead(proxyRes.statusCode, proxyRes.headers)
            proxyRes.pipe(res)
        })
        req.pipe(proxyRequest)
        proxyRequest.on("error", errorHandler(req, res, uid))
    }
}