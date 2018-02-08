## rproxy

[![Build Status](https://travis-ci.org/zhaosaisai/rproxy.svg?branch=master)](https://travis-ci.org/zhaosaisai/rproxy)
[![MIT Licence](https://badges.frapsoft.com/os/mit/mit.svg?v=103)](https://opensource.org/licenses/mit-license.php)   

Node http reverse proxy server

### 基本使用

**创建代理服务器**

```js
const http = require('http')
const proxyServer = require('.')

function createProxyServer(port) {
    return new Promise((resolve, reject) => {
        const server = http.createServer(proxyServer({
            servers: [
                "127.0.0.1:3100",
                "127.0.0.1:3101",
                "127.0.0.1:3102"
            ]
        }))
        server.listen(port, () => {
            console.log(`服务启动: ${port}`)
            resolve(server)
        })
        sever.on("error", reject)
    })
}
```
**创建负载服务器**

```js
const http = require('http')
function createServer(port) {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            const { method, url } = req
            if(method === "POST") {
                const chunks = []
                req.on('data', (data) => {
                    chunks.push(data)
                }) 
                req.on('end', () => {
                    const buffer = Buffer.concat(chunks)
                    res.end(`${method} ${url} ${buffer.toString()}`)
                })
            }else if(method === "GET") {
                res.end(`${method} ${url}`)
            }
        })
    })
}
```

**启动服务器**

```js
(async function() {
    await createServer(3100)
    await createServer(3101)
    await createServer(3102)
    await createProxyServer(3000)
})()
```

**请求**

```bash
curl http://127.0.0.1:3000/123
```
**响应**

```bash
GET /123
```