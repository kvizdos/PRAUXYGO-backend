class Roles {
    constructor() {
        this.role = {};

        const allPossiblePerms = {
            projectCap: -1,
            devTools: false,
            diskSpace: "50mb",
            terminal: false,
            uploadFile: false
        }

        this.role.free = {
            price: 0,
            perms: {
                ...allPossiblePerms,
                projectCap: 3,
                devTools: true
            }
        }
        this.role.pro = {
            price: 9.97,
            perms: {
                ...this.allPossiblePerms,
                projectCap: -1,
                devTools: true,
                diskSpace: "5gb",
                terminal: true,
                uploadFile: true
            }
        },
        
        this.role.ea = {...this.role.pro, price: 3.97};
    }

    getRolePerms(role) {
        return this.role[role].perms;
    }
}

module.exports.Roles = Roles;