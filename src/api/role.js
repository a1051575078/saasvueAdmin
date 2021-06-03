import request from '@/utils/request'
export function deleteRoles(id) {
    return request({
        url: `/roles/${id}`,
        method: 'delete'
    })
}
export function editRole(data) {
    return request({
        url: `/roles/${data}/edit`,
        method: 'get',
        data
    })
}
export function addRole(data) {
    return request({
        url: '/roles',
        method: 'post',
        data
    })
}
export function getRoutes() {
    return request({
        url: '/get-routes',
        method: 'get'
    })
}
export function getPermission() {
    return request({
        url: '/permissions',
        method: 'get'
    })
}

export function getRoles() {
    return request({
        url: '/roles',
        method: 'get'
    })
}

export function updatePermission(data) {
    return request({
        url: '/permissions/'+data.id,
        method: 'put',
        data
    })
}
export function addPermission(data) {
    return request({
        url: '/permissions',
        method: 'post',
        data
    })
}

export function updateRole(id, data) {
    return request({
        url: `/roles/${id}`,
        method: 'put',
        data
    })
}

export function deleteRole(id) {
    return request({
        url: `/permissions/${id}`,
        method: 'delete'
    })
}
