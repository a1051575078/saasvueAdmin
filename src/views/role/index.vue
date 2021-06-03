<template>
    <div class="app-container">
        <el-button type="primary" @click="handleAddRole">添加角色</el-button>
        <el-table :data="rolesList" style="width: 100%;margin-top:30px;" border>
            <el-table-column align="center" label="角色名称" min-width="10%">
                <template slot-scope="scope">
                    {{ scope.row.name }}
                </template>
            </el-table-column>
            <el-table-column align="center" label="角色权限" min-width="75%">
                <template slot-scope="scope">
                    {{ scope.row.role|isFalse}}
                </template>
            </el-table-column>
            <el-table-column align="center" label="操作" min-width="15%">
                <template slot-scope="scope">
                    <el-button type="primary" size="mini" @click="handleEdit(scope)">修改角色</el-button>
                    <el-button type="danger" size="mini" @click="handleDelete(scope)">刪除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <el-dialog :visible.sync="dialogVisible" :title="dialogType==='edit'?'修改角色':'新增角色'" width="30%">
            <el-form :model="role" label-width="100px" label-position="left" ref="form">
                <el-form-item label="角色名称:">
                    <el-input v-model="role.name" placeholder="角色名字" />
                </el-form-item>
                <el-form-item label="权限:">
                    <el-tree
                            ref="tree"
                            :check-strictly="checkStrictly"
                            :data="routesData"
                            :props="defaultProps"
                            show-checkbox
                            node-key="path"
                            class="permission-tree"
                    />
                </el-form-item>
            </el-form>
            <div style="text-align:right;">
                <el-button type="danger" @click="dialogVisible=false">取消</el-button>
                <el-button type="primary" @click="confirmRole()">提交</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
    import path from 'path'
    import { deepClone } from '@/utils'
    import { getRoutes, getRoles,editRole, getPermission, deleteRoles, updateRole ,addRole} from '@/api/role'

    const defaultRole = {
        key: '',
        name: '',
        description: '',
        routes: []
    }

    export default {
        filters:{
            isFalse(v){
                if(v===false){
                    return '无权限';
                }else{
                    return v;
                }
            }
        },
        data() {
            return {
                role: Object.assign({}, defaultRole),
                routes: [],
                rolesList: [],
                dialogVisible: false,
                dialogType: 'new',
                checkStrictly: false,
                defaultProps: {
                    children: 'children',
                    label: 'title'
                },
                permission:[],
            }
        },
        computed: {
            routesData() {
                return this.routes
            }
        },
        created() {
            // Mock: get all routes and roles list from server
            this.getRoutes();
            this.getPermission();
        },
        methods:{
            async getRoutes() {
               // console.log(this.$store.getters.menus)
                const res = await getRoutes();
                this.serviceRoutes =res.data;
                this.routes =await this.generateRoutes(res.data);
            },
            async getPermission() {
                const res = await getPermission()
                this.rolesList = res.data
            },

            // Reshape the routes structure so that it looks the same as the sidebar
            generateRoutes(routes, basePath = '/') {
                const res = []

                for (let route of routes) {
                    // skip some route
                    if (route.hidden) { continue }

                    const onlyOneShowingChild = this.onlyOneShowingChild(route.children, route)

                    if (route.children && onlyOneShowingChild && !route.alwaysShow) {
                        route = onlyOneShowingChild
                    }

                    const data = {
                        path: path.resolve(basePath, route.path),
                        title: route.meta && route.meta.title

                    }

                    // recursive child routes
                    if (route.children) {
                        data.children = this.generateRoutes(route.children, data.path)
                    }
                    res.push(data)
                }
                return res
            },
            generateArr(routes) {
                let data = []
                routes.forEach(route => {
                    data.push(route)
                    if (route.children) {
                        const temp = this.generateArr(route.children)
                        if (temp.length > 0) {
                            data = [...data, ...temp]
                        }
                    }
                })
                return data
            },
            handleAddRole() {
                this.role = Object.assign({}, defaultRole)
                if (this.$refs.tree) {
                    this.$refs.tree.setCheckedNodes([])
                }
                this.dialogType = 'new'
                this.dialogVisible = true
            },
            handleEdit(scope) {
                this.dialogType = 'edit'
                this.dialogVisible = true
                this.checkStrictly = true
                //查看当前角色的权限
                this.role=deepClone(scope.row);
                this.$nextTick(() => {
                    const routes = this.generateRoutes(this.role.routes)
                    this.$refs.tree.setCheckedNodes(this.generateArr(routes))
                    // set checked state of a node not affects its father and child nodes
                    this.checkStrictly = false
                })
            },
            handleDelete({ $index, row }) {
                this.$confirm('确认删除角色？', '警告', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                })
                    .then(async() => {
                        await deleteRoles(row.id)
                        this.rolesList.splice($index, 1)
                        this.$message({
                            type: 'success',
                            message: '删除成功!'
                        })
                    })
                    .catch(err => { console.error(err) })
            },
            generateTree(routes, basePath = '/', checkedKeys) {
                const res = []

                for (const route of routes) {
                    const routePath = path.resolve(basePath, route.path)

                    // recursive child routes
                    if (route.children) {
                        route.children = this.generateTree(route.children, routePath, checkedKeys)
                    }

                    if (checkedKeys.includes(routePath) || (route.children && route.children.length >= 1)) {
                        res.push(route)
                    }
                }
                return res
            },
            async confirmRole() {
                const isEdit = this.dialogType === 'edit'
                const checkedKeys = this.$refs.tree.getCheckedKeys();
                this.role.routes = this.generateTree(deepClone(this.serviceRoutes), '/', checkedKeys)
                this.dialogVisible = false
                if (isEdit) {
                    await updateRole(this.role.id,this.role)
                    .then(()=>{
                        this.getRoutes();
                        this.getPermission();
                    })
                    /*await updateRole(this.role.key, this.role)
                    for (let index = 0; index < this.rolesList.length; index++) {
                        if (this.rolesList[index].key === this.role.key) {
                            this.rolesList.splice(index, 1, Object.assign({}, this.role))
                            break
                        }
                    }*/
                } else {
                    addRole(this.role).then(()=>{
                        this.getRoutes();
                        this.getPermission();
                    })
                }
                this.$message({
                    message: '添加成功',
                    type: 'success'
                })

            },
            // reference: src/view/layout/components/Sidebar/SidebarItem.vue
            onlyOneShowingChild(children = [], parent) {
                let onlyOneChild = null
                const showingChildren = children.filter(item => !item.hidden)

                // When there is only one child route, the child route is displayed by default
                if (showingChildren.length === 1) {
                    onlyOneChild = showingChildren[0]
                    onlyOneChild.path = path.resolve(parent.path, onlyOneChild.path)
                    return onlyOneChild
                }

                // Show parent if there are no child route to display
                if (showingChildren.length === 0) {
                    onlyOneChild = { ... parent, path: '', noShowingChildren: true }
                    return onlyOneChild
                }

                return false
            }
        }
    }
</script>

<style lang="scss" scoped>
    .app-container {
        .roles-table {
            margin-top: 30px;
        }
        .permission-tree {
            margin-bottom: 30px;
        }
    }
</style>
