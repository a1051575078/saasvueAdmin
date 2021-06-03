import request from '@/utils/request'
export function deleteBlack(data) {
    return request({
        url:'/delete-black',
        method: 'post',
        data
    })
}
export function addTenancyWhitelist(data) {
    return request({
        url:'/add-tenancy-whitelist',
        method: 'post',
        data
    })
}
export function editUser(data) {
    return request({
        url:'/edit-user',
        method: 'post',
        data
    })
}
export function delUser(data) {
    return request({
        url:'/del-user',
        method: 'post',
        data
    })
}
export function storeUser(data) {
    return request({
        url:'/store-user',
        method: 'post',
        data
    })
}
export function getTenancyInfo(id) {
    return request({
        url:`/tenant/${id}`,
        method: 'get'
    })
}
export function updateTenant(data) {
    return request({
        url: '/tenant-update',
        method: 'post',
        data
    })
}
export function deleteAllTenant(data) {
    return request({
        url: '/delete-all-tenant',
        method: 'post',
        data
    })
}
export function deleteTenant(id) {
    return request({
        url: `/tenant/${id}`,
        method: 'delete'
    })
}
export function addTenant(data) {
    return request({
        url: '/tenant',
        method: 'post',
        data
    })
}
export function getTenancyTable() {
    return request({
        url: '/tenant',
        method: 'get'
    })
}
export function updateAdmin(id, data) {
    return request({
        url: `/admins/${id}`,
        method: 'put',
        data
    })
}
export function addAdmin(data) {
    return request({
        url: '/admins',
        method: 'post',
        data
    })
}
export function getAdminTable() {
    return request({
        url: '/admins',
        method: 'get'
    })
}
export function deleteAdmin(id) {
    return request({
        url: `/admins/${id}`,
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


export function deleteRole(id) {
    return request({
        url: `/permissions/${id}`,
        method: 'delete'
    })
}
