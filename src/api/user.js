import request from '@/utils/request'
export function login(data) {
    return request({
        url: '/login',
        method: 'post',
        data
    })
}
export function getInfo(token) {
    return request({
        url: '/user-info',
        method: 'get',
        params: { token }
    })
}
export function logout() {
    return request({
        url: '/logout',
        method: 'post'
    })
}
export function refreshToken(){
    return request({
        url:'/refresh',
        method:'get'
    })
}