var Ajax = function() {
    var request = xmlHttpRequest();
    
    //GET请求
    this.get = function(opts, callback) {
        var defaults = {
        	url:'',
        	data:'',
            async:true   //默认为异步操作
        }
        defaults = objToObj(opts,defaults)

        if(typeof defaults.data === 'object' && JSON.stringify(defaults.data) !== '{}') defaults.url = defaults.url + '?' + encodeFormData(defaults.data);
        request.onreadystatechange = function() {
            //如果请求完成且成功
            if (request.readyState === 4 && request.status === 200) {
                //获得响应的类型
                var type = request.getResponseHeader('Content-Type');
                //检查类型，这样我们就不能在将来得到HTML文档
                if (type.indexOf('xml') !== -1 && request.responseXML) {
                    callback(request.responseXML) //Document对象响应
                } else if (type === 'application/json; charset=utf-8') {
                    callback(JSON.parse(request.responseText)) //JSON对象响应
                } else {
                    callback(request.responseText) //字符串响应
                }
            }
        }
        request.open("GET", defaults.url,defaults.async);
        request.send(null)
    };

    
    //POST请求
    this.post = function(opts,callback){
    	var defaults = {
        	url:'',
        	data:'',
            async:true,    //默认为异步操作
            ContentType:'application/x-www-form-urlencoded'   //默认编码请求
        }
        defaults = objToObj(opts,defaults)
    	request.onreadystatechange = function() {
            //如果请求完成且成功
            if (request.readyState === 4 && request.status === 200 && callback) {
                //获得响应的类型
                var type = request.getResponseHeader('Content-Type');
                //检查类型，这样我们就不能在将来得到HTML文档
                if (type.indexOf('xml') !== -1 && request.responseXML) {
                    callback(request.responseXML) //Document对象响应
                } else if (type === 'application/json; charset=utf-8') {
                    callback(JSON.parse(request.responseText)) //JSON对象响应
                } else {
                    callback(request.responseText) //字符串响应
                }
            }
        }
        
       request.open("POST", defaults.url,defaults.async);
       request.setRequestHeader('Content-Type',defaults.ContentType)
       switch(defaults.ContentType){
       	   case 'application/x-www-form-urlencoded':
           defaults.data = encodeFormData(defaults.data);
           break;
           case 'application/json':
           defaults.data = JSON.stringify(defaults.data);
           break;
       }
       request.send(defaults.data)
    };

    //multipart/form-data请求
    this.formData = function(opts,callback){
        if(typeof FormData === 'undefined') throw new Error('FormData is not implemented');
        var defaults = {
            url:'',
            data:'',
            async:true,   //默认为异步操作
        }
        defaults = objToObj(opts,defaults);

        request.open('POST',defaults.url)
        request.onreadystatechange = function() {
            //如果请求完成且成功
            if (request.readyState === 4 && request.status === 200 && callback) {
                //获得响应的类型
                var type = request.getResponseHeader('Content-Type');
                //检查类型，这样我们就不能在将来得到HTML文档
                if (type.indexOf('xml') !== -1 && request.responseXML) {
                    callback(request.responseXML) //Document对象响应
                } else if (type === 'application/json; charset=utf-8') {
                    callback(JSON.parse(request.responseText)) //JSON对象响应
                } else {
                    callback(request.responseText) //字符串响应
                }
            }
        }

        var formdata = new FormData();
        for(var name in defaults.data){
            if(!defaults.data.hasOwnProperty(name)) continue;    //跳过继承方法
            var value = defaults.data[name];
            if(typeof value === 'function') continue;   //跳过方法
            //每个属性变成请求的一个部分
            //这里允许File对象
            formdata.append(name,value);    //做为一部分添加名/值对
        }
        //在 multipart/form-data请求主体中发送名/值对
        //每对都是请求的一个部分，注意，当传入FormData对象时，send()会自动设置Content-Type
        request.send(formdata)
    };
    
    //JSONP跨域请求：借助<script>元素发送HTTP请求
    this.getJSONP = function(opts, callback) {
        var defaults = {
            url: '',
            data: ''
        }
        defaults = objToObj(opts, defaults);
        if (typeof defaults.data === 'object' && JSON.stringify(defaults.data) !== '{}') defaults.url = defaults.url + '?' + encodeFormData(defaults.data);
        //为本次请求创建一个唯一的回调函数名称
        var cbnum = 'cb' + getJSONP.counter++;   //每次自增计数器
        var cbname = 'getJSONP.' + cbnum;        //做为JSONP函数的属性
        //将回调函数名称以表单编码的形式添加到URL的查询部分中
        //使用jsonp做为参数名，一些支持JSONP的服务，也可以使用其他参数名,比如callback，但是一定要与服务端一致服务端
        if (defaults.url.indexOf('?') === -1) {   //url没有查询部分
            defaults.url += "?jsonp=" + cbname;   //做为查询部分添加参数
        } else {
            defaults.url += "&jsonp=" + cbname;   //做为新的参数添加它
        }

        //创建script元素用于发送请求
        var script = document.createElement('script');
        //定义将被脚本执行的回调函数
        getJSONP[cbnum] = function(response) {
            try {
                callback(response);  //处理响应数据
            } 
            finally {   //即使回调函数或响应抛出错误
                delete getJSONP[cbnum];    //删除该函数
                script.parentNode.removeChild(script);   //移除script元素
            }
        };
        //立即出发HTTP请求
        script.src = defaults.url;     //设置脚本的URL
        document.body.appendChild(script);    //把它添加到文档中
    };
    getJSONP.counter = 0;    //用于创建唯一回调函数名称的计数器
    
    
    
    //把obj1覆盖obj2，只覆盖obj2中存在的属性
    function objToObj(obj1,obj2){
    	for(key in obj1){
        	if(!obj2.hasOwnProperty(key)) continue;
        	obj2[key] = obj1[key];
        }
        return obj2;
    }


    //实例化XMLHttpRequest对象
    function xmlHttpRequest() {
        if (window.XMLHttpRequest) {
            return new XMLHttpRequest();
        } else { //在IE5和IE6中模拟XMLHttpRequest()构造函数
            window.XMLHttpRequest = function() {
                try {
                    //如果可用，则使用Active对象的最新版本
                    return new ActiveXObject('Msxml2.XMLHTTP.6.0');
                } catch (e1) {
                    try {
                        //否则，回退到较旧版本
                        return new ActiveXObject('Msxml2.XMLHTTP.3.0')
                    } catch (e2) {
                        //否则，抛错
                        throw new Error('XMLHttpRequest is not supported')
                    }
                }
            };
        }
    }


    /**
     * 传入对象，变成application/x-www-form-urlencoded格式
     */
    function encodeFormData(data) {
        if (!data) return '';
        var pairs = [];
        for (var name in data) {
            if (!data.hasOwnProperty(name)) continue;
            if (typeof data[name] === 'function') continue;
            var value = data[name].toString();
            name = encodeURIComponent(name.replace('%20', '+'));
            value = encodeURIComponent(value.replace('%20', '+'));
            pairs.push(name + "=" + value);
        }
        return pairs.join('&');
    }
}
