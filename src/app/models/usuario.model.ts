import { FormGroup } from '@angular/forms';
export class UsuarioModel {
    public idUsuario?: string;
    public avatar?: string;
    public firma?: string;
    public formBasic?: FormGroup;

    constructor(){

    }
}

export class UserFirebase {
    public _delegate?: {};
    public multiFactor?:MultiFactor;
}
export class MultiFactor {
    public enrolledFactors?: [];
    public user?: UserModel;
}

export class UserModel {
    public email?: string;
    public displayName?: string;
    public photoURL?: string;
    public uid?: string;
}
