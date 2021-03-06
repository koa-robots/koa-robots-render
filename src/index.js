import fs from 'co-fs'
import LRU from 'lru-cache'
import template from 'art-template'
import {join, normalize, resolve} from 'path'

export default function(root = '.', options = {}, cache){
    options = Object.assign({
        max : 100,
        cache : true,
        helpers : null,
        index : '/index'
    }, options)

    cache = LRU(options.max)
    template.config('openTag', '<%=')
    template.config('closeTag', '%>')
    template.config('cache', false)
    template.config('base', root = normalize(resolve(root)))

    for(let key in options.helpers){
        template.helper(key, options.helpers[key])
    }

    return function *(next){
        yield next

        let path = join(root, (this.path === '/' ? options.index : this.path) + '.html')

        try{
            if((yield fs.stat(path)).isFile()){
                if(!options.cache){
                    cache.reset()
                }

                this.type = 'html'
                this.body = yield render(cache, path, this.body, this.state.renderData)
            }
        }catch(err){
            if (~['ENOENT', 'ENAMETOOLONG', 'ENOTDIR'].indexOf(err.code)){
                return
            }
        }
    }
}

function *render(cache, path, data, renderData = {}){
    let compile = cache.get(path)

    if(!compile){
        compile = template.compile(yield fs.readFile(path, 'utf-8'))
        cache.set(path, compile)
    }

    if(typeof data === 'object' && !Array.isArray(data)){
        return compile(Object.assign({}, renderData, data))
    }else{
        return compile(renderData)
    }
}
