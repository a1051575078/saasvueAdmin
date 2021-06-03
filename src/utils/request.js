import axios from 'axios'
import { MessageBox, Message } from 'element-ui'
import store from '@/store'
import { getToken,setToken } from '@/utils/auth'
import router from "@/router";

// create an axios instance
const service = axios.create({
    baseURL:'http://104.149.204.2/admin/',//window.location.protocol+"//"+window.location.host+'/admin/',// process.env.VUE_APP_BASE_API, // url = base url + request url
    // withCredentials: true, // send cookies when cross-domain requests
    timeout: 50000
})

// 给实例添加一个setToken方法，用于登录后将最新token动态添加到header
service.setToken = (token) => {
    service.defaults.headers['Authorization'] = token;
    setToken( token);
}
// request interceptor
service.interceptors.request.use(
    config => {
        // do something before request is sent
        if (store.getters.token) {
            // let each request carry token
            // ['X-Token'] is a custom headers key
            // please modify it according to the actual situation
            config.headers['Authorization'] = getToken()
        }
        return config
    },
    error => {
        // do something with request error
        console.log(error) // for debug
        return Promise.reject(error)
    }
)

// response interceptor
service.interceptors.response.use(
    /**
     * If you want to get http information such as headers or status
     * Please return  response => response
     */

    /**
     * Determine the request status by custom code
     * Here is just an example
     * You can also judge the status by HTTP Status Code
     */
    response => {
        const res = response.data
        // if the custom code is not 20000, it is judged as an error.
        if (res.code !== 200) {
            Message({
                message: res.msg || 'Error',
                type: 'error',
                duration: 5 * 1000
            })
            if(res.code===444){
                localStorage.setItem('getAddress','nohave');
            }
            // 50008: Illegal token; 50012: Other clients logged in; 50014: Token expired;
            if (res.code === 50008 || res.code === 50012 || res.code === 50014) {
                // to re-login
                MessageBox.confirm('You have been logged out, you can cancel to stay on this page, or log in again', 'Confirm logout', {
                    confirmButtonText: 'Re-Login',
                    cancelButtonText: 'Cancel',
                    type: 'warning'
                }).then(()=>{
                    store.dispatch('user/resetToken').then(()=>{
                        location.reload()
                    })
                });
            }
        return res.msg;//ssad
            //return Promise.reject(new Error(res.message || 'Error'))
        } else {
            return res;
        }
    },
    error => {
        // 是否正在刷新的标记
        let isRefreshing = false;
        // 重试队列，每一项将是一个待执行的函数形式
        let requests = [];
        if(error.response){
            if(error.response.status===401){
                const config=error.response.config;
                if(!isRefreshing){
                    isRefreshing=true;
                    return refreshToken()
                        .then(res=>{
                            const token=res;
                            service.setToken(token);
                            config.headers['Authorization']=token;
                            config.baseURL='';
                            //已经刷新了token,将所有队列中的请求进行重试
                            requests.forEach(cb=>cb(token));
                            requests=[];
                            return service(config);
                        }).catch(res=>{
                            router.push('/login');
                        }).finally(()=>{
                            isRefreshing=false;
                        })
                }else{
                    // 正在刷新token，将返回一个未执行resolve的promise
                    return new Promise((resolve) => {
                        // 将resolve放进队列，用一个函数形式来保存，等token刷新后直接执行
                        requests.push((token) => {
                            config.baseURL = ''
                            config.headers['Authorization'] = token
                            resolve(service(config))
                        })
                    })
                }
            }
        }
        return Promise.reject(error);
        /*if(error.response){
            if(error.response.status===401){
                if(router.currentRoute.path!=='/login'){
                    return doRequest(error);
                }
            }
        }
        return Promise.reject(error)*/
    }
)
function refreshToken () {
    // instance是当前request.js中已创建的axios实例
    return store.dispatch('user/refreshToken')
}
async function doRequest(error){
    const token=await store.dispatch('user/refreshToken')
    let config=error.response.config;
    config.headers.Authorization = token;
    return await axios.request(config);
}
export default service
