import co from 'co'
import koa from 'koa'
import fs from 'co-fs'
import {join} from 'path'
import render from '../dist'
import request from 'supertest'

describe('render', () => {
    it('normal', (done) => {
        var app, agent

        app = koa()
        app.use(render('./test/html'))
        app.use(function *(next){
            switch (this.path) {
                case '/':
                    this.globalData = {index : 1}
                    break
                case '/data':
                    this.body = {'result' : 'hello world'}
                    break
                case '/data2':
                    this.body = {'result' : 'hello world'}
                    break
                case '/xss':
                    this.body = {'result' : '<script>xss</script>'}
                    break
            }
        })

        agent = request(app.listen())

        agent.get('/').expect('index1', (err) => {
            if(err) throw err
        })

        agent.get('/data').expect('result : hello world', (err) => {
            if(err) throw err
        })

        agent.get('/data2').expect('{"result":"hello world"}', (err) => {
            if(err) throw err
        })

        agent.get('/xss').expect('result : &#60;script&#62;xss&#60;/script&#62;result2 : <script>xss</script>', (err) => {
            if(err) throw err
            done()
        })
    })

    it('include', (done) => {
        var app, agent

        app = koa()
        app.use(render('./test/html'))

        agent = request(app.listen())

        agent.get('/a').expect('abc', (err) => {
            if(err) throw err
        })

        agent.get('/b').expect('bc', (err) => {
            if(err) throw err
            done()
        })
    })

    it('cache : true', (done) => {
        co(function *(){
            var app, agent, content, path

            app = koa()
            content = ''
            path = join(process.cwd(), './test/html/index.html')

            app.use(render('./test/html'))
            app.use(function *(next){
                this.body = {index : 2}
            })

            content += yield fs.readFile(path)
            agent = request(app.listen())

            agent.get('/').expect('index2', function(err){
                if(err) throw err
                co(function *(){
                    yield fs.writeFile(path, 'index{{index}}{{index}}')
                    agent.get('/').expect('index2', function(err){
                        if(err) throw err
                        co(function *(){
                            yield fs.writeFile(path, content)
                            done()
                        })
                    })
                })
            })
        })
    })

    it('cache : false', (done) => {
        co(function *(){
            var app, agent, content, path

            app = koa()
            content = ''
            path = join(process.cwd(), './test/html/index.html')

            app.use(render('./test/html', {
                cache : false
            }))

            app.use(function *(next){
                this.body = {index : 3}
            })

            content += yield fs.readFile(path)
            agent = request(app.listen())

            agent.get('/').expect('index3', function(err){
                if(err) throw err
                co(function *(){
                    yield fs.writeFile(path, 'index{{index}}{{index}}')
                    agent.get('/').expect('index33', function(err){
                        if(err) throw err
                        co(function *(){
                            yield fs.writeFile(path, content)
                            done()
                        })
                    })
                })
            })
        })
    })
})
