const http = require('http')
const util = require('util')
const supertest = require('supertest')
const proxyServer = require('./')


function log(...infos) {
    const time = new Date().toLocaleString()
    console.log(time, util.format(...infos))
}

// 创建代理服务器
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
            log("代理服务器已经启动 [%s]", port)
            resolve(server)
        })
        server.on("error", reject)
    })
}

function createServer(port) {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            const { method } = req
            if(method === "POST") {
                const chunks = []
                req.on('data', (data) => {
                    chunks.push(data)
                })
                req.on('end', () => {
                    const buf = Buffer.concat(chunks)
                    res.end(`${port}: ${req.method} ${req.url} ${buf.toString()}`)
                })
            }else if(method === "GET"){
                res.end(`${port}: ${req.method} ${req.url}`.trim())
            }
        })
        server.listen(port, () => {
            log("启动服务器 [%s]", port)
            resolve(server)
        })
        server.on("error", reject)
    })
}

describe("测试代理服务器", () => {
    let server = null
    let servers = []

    before(async function() {
        servers.push(await createServer(3100))
        servers.push(await createServer(3101))
        servers.push(await createServer(3102))
        server = await createProxyServer(3000)
    })

    after(async function() {
        servers.forEach(server => server.close())
        server.close()
    })

    it("按照顺序调用各个负载服务器", async () => {
        await supertest(server)
            .get("/123")
            .expect(200)
            .expect("3100: GET /123")
        
        await supertest(server)
            .get("/456")
            .expect(200)
            .expect("3101: GET /456")
        
        await supertest(server)
            .get("/789")
            .expect(200)
            .expect("3102: GET /789")
        
        await supertest(server)
            .get("/123?name=saisai")
            .expect(200)
            .expect("3100: GET /123?name=saisai")
    })

    it("应该支持post请求", async () => {
        const data = {
            name: 'saisai',
            ahe: 23
        }
        await supertest(server)
            .post("/post")
            .send(data)
            .expect(200)
            .expect(`3101: POST /post ${JSON.stringify(data)}`)
    })
})
